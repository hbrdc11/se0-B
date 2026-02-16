import React, { useEffect, useRef, useState } from 'react';
import { Heart, AlertTriangle, Zap, XCircle, CheckCircle, Move, MousePointer2 } from 'lucide-react';

interface TripRunGameProps {
  onBack: () => void;
}

// Oyun Durumları
type GameState = 'menu' | 'playing' | 'caught' | 'reconciled';

// Varlık Tipleri
interface Entity {
  id: number;
  x: number;
  y: number;
  type: 'obstacle' | 'deco';
  emoji: string;
}

interface JoystickState {
  id: number | string | null; // Touch identifier or 'mouse'
  active: boolean;
  dx: number;
  dy: number;
}

const TripRunGame: React.FC<TripRunGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Joystick DOM Refs (Konum hesaplaması için)
  const runnerBaseRef = useRef<HTMLDivElement>(null);
  const chaserBaseRef = useRef<HTMLDivElement>(null);
  
  // Joystick Knob Refs (Performanslı animasyon için direct DOM manipülasyonu)
  const runnerKnobRef = useRef<HTMLDivElement>(null);
  const chaserKnobRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [tripDuration, setTripDuration] = useState(0);
  const [tripLevel, setTripLevel] = useState(0);
  
  // --- POZİSYONLAR ---
  const runnerPos = useRef({ x: 0, y: -250 }); // Üst Oyuncu
  const chaserPos = useRef({ x: 0, y: 250 });  // Alt Oyuncu
  
  // --- KONTROLLER ---
  const runnerJoy = useRef<JoystickState>({ id: null, active: false, dx: 0, dy: 0 });
  const chaserJoy = useRef<JoystickState>({ id: null, active: false, dx: 0, dy: 0 });
  
  // Klavye Durumu
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // AYARLAR
  const PLAYER_SPEED = 2; // Hız düşürüldü (Eskiden 3)
  const JOYSTICK_MAX_RADIUS = 35;
  const CAMERA_ZOOM = 0.6; 

  // Harita Varlıkları
  const obstacles = useRef<Entity[]>([]);
  
  // Frame Loop
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Images
  const runnerImgRef = useRef<HTMLImageElement | null>(null);
  const chaserImgRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // --- HELPER FUNCTIONS (Defined before usage) ---

  const getBiomeEmoji = (x: number, y: number): string => {
    if (y < -1000) return Math.random() > 0.7 ? '🌲' : '🍄'; 
    if (y > 1000) return Math.random() > 0.7 ? '🌵' : '🦂';  
    if (x > 1000) return Math.random() > 0.7 ? '🏢' : '🚗';  
    if (x < -1000) return Math.random() > 0.7 ? '🌸' : '🌷'; 
    const defaults = ['🌳', '🪨', '💐', '🚧', '🪵'];
    return defaults[Math.floor(Math.random() * defaults.length)];
  };

  const createEntityAt = (x: number, y: number): Entity => {
    return {
      id: Math.random(),
      x,
      y,
      type: Math.random() > 0.8 ? 'obstacle' : 'deco',
      emoji: getBiomeEmoji(x, y)
    };
  };

  const generateInitialObstacles = () => {
    const arr: Entity[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 400 + Math.random() * 1000;
      arr.push(createEntityAt(Math.cos(angle) * dist, Math.sin(angle) * dist));
    }
    return arr;
  };

  const resetJoystick = (joyRef: React.MutableRefObject<JoystickState>, knobRef: React.RefObject<HTMLDivElement | null>) => {
    joyRef.current = { id: null, active: false, dx: 0, dy: 0 };
    if (knobRef.current) {
        knobRef.current.style.transform = `translate(0px, 0px)`;
    }
  };

  // --- RESİMLERİ YÜKLE ---
  useEffect(() => {
    const img1 = new Image();
    img1.src = 'https://i.imgur.com/waEyaQR.jpeg'; // Elif
    img1.onload = () => { runnerImgRef.current = img1; };

    const img2 = new Image();
    img2.src = 'https://i.imgur.com/905saAD.jpeg'; // Kamil
    img2.onload = () => { chaserImgRef.current = img2; setImagesLoaded(true); };
  }, []);

  // --- KLAVYE DİNLEYİCİLERİ ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
    
    // Klavye olaylarında sayfa kaymasını engelle (ok tuşları için)
    const handleKeyScroll = (e: KeyboardEvent) => {
        if(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyScroll);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyScroll);
    };
  }, []);

  // --- OYUN DÖNGÜSÜ ---
  
  const startGame = () => {
    setGameState('playing');
    setTripDuration(0);
    setTripLevel(0);
    // Başlangıç pozisyonları
    runnerPos.current = { x: 0, y: -250 };
    chaserPos.current = { x: 0, y: 250 };
    
    // Reset Joysticks
    resetJoystick(runnerJoy, runnerKnobRef);
    resetJoystick(chaserJoy, chaserKnobRef);

    obstacles.current = generateInitialObstacles();
    startTimeRef.current = Date.now();
  };

  // --- UPDATE ---
  
  const update = () => {
    if (gameState !== 'playing') return;

    // --- 1. RUNNER HAREKETİ ---
    let rDx = 0;
    let rDy = 0;

    // Joystick Input
    if (runnerJoy.current.active) {
      rDx += (runnerJoy.current.dx / JOYSTICK_MAX_RADIUS);
      rDy += (runnerJoy.current.dy / JOYSTICK_MAX_RADIUS);
    }
    
    // Klavye Input (WASD)
    if (keysPressed.current['w']) rDy -= 1;
    if (keysPressed.current['s']) rDy += 1;
    if (keysPressed.current['a']) rDx -= 1;
    if (keysPressed.current['d']) rDx += 1;

    // Normalize
    const rLen = Math.sqrt(rDx*rDx + rDy*rDy);
    if (rLen > 0) {
        // Runner Speed
        const speed = rLen > 1 ? PLAYER_SPEED : PLAYER_SPEED * rLen;
        runnerPos.current.x += (rDx / rLen) * speed;
        runnerPos.current.y += (rDy / rLen) * speed;
    }


    // --- 2. CHASER HAREKETİ ---
    let cDx = 0;
    let cDy = 0;

    if (chaserJoy.current.active) {
      cDx += (chaserJoy.current.dx / JOYSTICK_MAX_RADIUS);
      cDy += (chaserJoy.current.dy / JOYSTICK_MAX_RADIUS);
    }

    // Klavye Input (OK TUŞLARI)
    if (keysPressed.current['arrowup']) cDy -= 1;
    if (keysPressed.current['arrowdown']) cDy += 1;
    if (keysPressed.current['arrowleft']) cDx -= 1;
    if (keysPressed.current['arrowright']) cDx += 1;

    const cLen = Math.sqrt(cDx*cDx + cDy*cDy);
    if (cLen > 0) {
        // Chaser slightly faster (1.06x) to eventually catch up
        const speed = (cLen > 1 ? PLAYER_SPEED : PLAYER_SPEED * cLen) * 1.06;
        chaserPos.current.x += (cDx / cLen) * speed;
        chaserPos.current.y += (cDy / cLen) * speed;
    }


    // --- 3. Collision ---
    const dx = runnerPos.current.x - chaserPos.current.x;
    const dy = runnerPos.current.y - chaserPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 50) { 
      setGameState('caught');
      return;
    }

    // --- 4. Sonsuz Dünya & Temizlik ---
    const midX = (runnerPos.current.x + chaserPos.current.x) / 2;
    const midY = (runnerPos.current.y + chaserPos.current.y) / 2;

    obstacles.current = obstacles.current.filter(obs => {
      const d = Math.sqrt((obs.x - midX)**2 + (obs.y - midY)**2);
      return d < 2500; 
    });

    if (obstacles.current.length < 60) {
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = 1200 + Math.random() * 800;
      obstacles.current.push(createEntityAt(midX + Math.cos(angle) * spawnDist, midY + Math.sin(angle) * spawnDist));
    }

    setTripDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
  };

  // --- DRAW ---

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const midX = (runnerPos.current.x + chaserPos.current.x) / 2;
    const midY = (runnerPos.current.y + chaserPos.current.y) / 2;

    // Viewport Calculations (Off-screen detection)
    const worldW = width / CAMERA_ZOOM;
    const worldH = height / CAMERA_ZOOM;
    
    const left = midX - worldW / 2;
    const right = midX + worldW / 2;
    const top = midY - worldH / 2;
    const bottom = midY + worldH / 2;
    
    // Check if players are near edge or off screen (with margin)
    const margin = 100;
    const isRunnerOff = runnerPos.current.x < left + margin || runnerPos.current.x > right - margin || runnerPos.current.y < top + margin || runnerPos.current.y > bottom - margin;
    const isChaserOff = chaserPos.current.x < left + margin || chaserPos.current.x > right - margin || chaserPos.current.y < top + margin || chaserPos.current.y > bottom - margin;


    ctx.save();
    
    // KAMERA MERKEZLEME VE ZOOM
    ctx.translate(width / 2, height / 2);
    ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
    ctx.translate(-midX, -midY);

    // Zemin Grid
    ctx.lineWidth = 2;
    const gridSize = 200;
    
    const startX = midX - (width/CAMERA_ZOOM)/2 - 200;
    const startY = midY - (height/CAMERA_ZOOM)/2 - 200;
    const endX = midX + (width/CAMERA_ZOOM)/2 + 200;
    const endY = midY + (height/CAMERA_ZOOM)/2 + 200;
    
    const snapStartX = startX - (startX % gridSize);
    const snapStartY = startY - (startY % gridSize);

    ctx.strokeStyle = 'rgba(200, 210, 230, 0.3)';
    ctx.beginPath();
    
    for (let x = snapStartX; x < endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = snapStartY; y < endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Objeler
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.1)";
    ctx.shadowBlur = 4;
    
    obstacles.current.forEach(obs => {
       ctx.fillText(obs.emoji, obs.x, obs.y);
    });

    // Connector Line (If off screen)
    if (isRunnerOff || isChaserOff) {
        ctx.beginPath();
        ctx.moveTo(runnerPos.current.x, runnerPos.current.y);
        ctx.lineTo(chaserPos.current.x, chaserPos.current.y);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)'; // Slate-500 low opacity
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 15]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset
    }

    // Oyuncular
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 15;
    
    const playerSize = 60;

    // Runner (Y) -> ELİF
    if (runnerImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(runnerPos.current.x, runnerPos.current.y, playerSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(runnerImgRef.current, runnerPos.current.x - playerSize/2, runnerPos.current.y - playerSize/2, playerSize, playerSize);
        ctx.restore();
        // Border
        ctx.beginPath();
        ctx.arc(runnerPos.current.x, runnerPos.current.y, playerSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#e11d48'; // Rose-600
        ctx.lineWidth = 3;
        ctx.stroke();
    } else {
        ctx.font = "50px Arial";
        ctx.fillText("💃", runnerPos.current.x, runnerPos.current.y);
    }
    
    // Elif Label
    ctx.font = "bold 14px sans-serif";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "white";
    ctx.strokeText("ELİF", runnerPos.current.x, runnerPos.current.y - 45);
    ctx.fillStyle = "#e11d48"; 
    ctx.fillText("ELİF", runnerPos.current.x, runnerPos.current.y - 45);

    // Chaser (X) -> KAMİL
    if (chaserImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(chaserPos.current.x, chaserPos.current.y, playerSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(chaserImgRef.current, chaserPos.current.x - playerSize/2, chaserPos.current.y - playerSize/2, playerSize, playerSize);
        ctx.restore();
        // Border
        ctx.beginPath();
        ctx.arc(chaserPos.current.x, chaserPos.current.y, playerSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#334155'; // Slate-700
        ctx.lineWidth = 3;
        ctx.stroke();
    } else {
        ctx.font = "50px Arial";
        ctx.fillText("🏃‍♂️", chaserPos.current.x, chaserPos.current.y);
    }
    
    // Kamil Label
    ctx.font = "bold 14px sans-serif";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "white";
    ctx.strokeText("KAMİL", chaserPos.current.x, chaserPos.current.y - 45);
    ctx.fillStyle = "#334155"; 
    ctx.fillText("KAMİL", chaserPos.current.x, chaserPos.current.y - 45);

    ctx.restore();
  };

  const loop = () => {
    update();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
         draw(ctx, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      }
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext('2d');
            ctx?.scale(dpr, dpr);
        }
    }

    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);


  // --- JOYSTICK LOGIC (MOUSE & TOUCH) ---
  
  const updateJoystick = (clientX: number, clientY: number, base: HTMLElement, knob: HTMLElement | null, joyState: JoystickState) => {
    if (!base || !knob) return;

    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOYSTICK_MAX_RADIUS) {
        const ratio = JOYSTICK_MAX_RADIUS / dist;
        dx *= ratio;
        dy *= ratio;
    }

    joyState.dx = dx;
    joyState.dy = dy;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  // -- TOUCH EVENTS --
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      
      if (runnerBaseRef.current && !runnerJoy.current.active) {
        const rect = runnerBaseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        if (Math.sqrt((t.clientX - centerX) ** 2 + (t.clientY - centerY) ** 2) < 80) {
            runnerJoy.current = { id: t.identifier, active: true, dx: 0, dy: 0 };
            updateJoystick(t.clientX, t.clientY, runnerBaseRef.current, runnerKnobRef.current, runnerJoy.current);
            continue;
        }
      }

      if (chaserBaseRef.current && !chaserJoy.current.active) {
        const rect = chaserBaseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        if (Math.sqrt((t.clientX - centerX) ** 2 + (t.clientY - centerY) ** 2) < 80) {
            chaserJoy.current = { id: t.identifier, active: true, dx: 0, dy: 0 };
            updateJoystick(t.clientX, t.clientY, chaserBaseRef.current, chaserKnobRef.current, chaserJoy.current);
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === runnerJoy.current.id && runnerBaseRef.current) {
        updateJoystick(t.clientX, t.clientY, runnerBaseRef.current, runnerKnobRef.current, runnerJoy.current);
      }
      if (t.identifier === chaserJoy.current.id && chaserBaseRef.current) {
         updateJoystick(t.clientX, t.clientY, chaserBaseRef.current, chaserKnobRef.current, chaserJoy.current);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === runnerJoy.current.id) resetJoystick(runnerJoy, runnerKnobRef);
      if (t.identifier === chaserJoy.current.id) resetJoystick(chaserJoy, chaserKnobRef);
    }
  };

  // -- MOUSE EVENTS --
  const handleMouseDown = (e: React.MouseEvent, type: 'runner' | 'chaser') => {
      e.preventDefault(); 
      const joyRef = type === 'runner' ? runnerJoy : chaserJoy;
      const baseRef = type === 'runner' ? runnerBaseRef : chaserBaseRef;
      const knobRef = type === 'runner' ? runnerKnobRef : chaserKnobRef;

      joyRef.current = { id: 'mouse', active: true, dx: 0, dy: 0 };
      if (baseRef.current) {
        updateJoystick(e.clientX, e.clientY, baseRef.current, knobRef.current, joyRef.current);
      }
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
        if (runnerJoy.current.id === 'mouse' && runnerBaseRef.current) {
            updateJoystick(e.clientX, e.clientY, runnerBaseRef.current, runnerKnobRef.current, runnerJoy.current);
        }
        if (chaserJoy.current.id === 'mouse' && chaserBaseRef.current) {
            updateJoystick(e.clientX, e.clientY, chaserBaseRef.current, chaserKnobRef.current, chaserJoy.current);
        }
    };

    const handleWindowMouseUp = () => {
        if (runnerJoy.current.id === 'mouse') resetJoystick(runnerJoy, runnerKnobRef);
        if (chaserJoy.current.id === 'mouse') resetJoystick(chaserJoy, chaserKnobRef);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);


  // --- TRIP SEÇENEKLERİ ---
  const handleTripOption = (action: 'git' | 'hih' | 'istemiyorum' | 'gel') => {
    if (action === 'gel') {
      setGameState('reconciled');
      return;
    }

    setTripLevel(prev => prev + 1);
    
    // GIT -> Push
    if (action === 'git') {
       const dx = chaserPos.current.x - runnerPos.current.x;
       const dy = chaserPos.current.y - runnerPos.current.y;
       const len = Math.sqrt(dx*dx + dy*dy) || 1;
       chaserPos.current.x += (dx/len) * 600;
       chaserPos.current.y += (dy/len) * 600;
    }
    
    // HIH -> Stun (Hafif itme)
    if (action === 'hih') {
       const dx = chaserPos.current.x - runnerPos.current.x;
       const dy = chaserPos.current.y - runnerPos.current.y;
       const len = Math.sqrt(dx*dx + dy*dy) || 1;
       chaserPos.current.x += (dx/len) * 200;
       chaserPos.current.y += (dy/len) * 200;
    }

    // ISTEMIYORUM -> Strong Push
    if (action === 'istemiyorum') {
       const dx = chaserPos.current.x - runnerPos.current.x;
       const dy = chaserPos.current.y - runnerPos.current.y;
       const len = Math.sqrt(dx*dx + dy*dy) || 1;
       chaserPos.current.x += (dx/len) * 900;
       chaserPos.current.y += (dy/len) * 900;
    }

    setGameState('playing');
    startTimeRef.current = Date.now() - (tripDuration * 1000);
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
      
      {/* CANVAS LAYER */}
      <canvas 
        ref={canvasRef}
        className="w-full h-full block bg-[#f8fafc]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* --- OYUN ARAYÜZÜ (CONTROLLERS) --- */}
      {gameState === 'playing' && (
        <>
            {/* ÜST OYUNCU (RUNNER) CONTROLLER */}
            <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none">
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 rotate-180 flex flex-col items-center pointer-events-auto">
                     <div 
                       ref={runnerBaseRef}
                       onMouseDown={(e) => handleMouseDown(e, 'runner')}
                       className="w-24 h-24 rounded-full bg-rose-100/50 border-4 border-rose-300 backdrop-blur-sm relative flex items-center justify-center shadow-xl cursor-pointer"
                     >
                        <div 
                          ref={runnerKnobRef}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg border-2 border-white/50"
                        />
                     </div>
                     <span className="text-rose-400 font-bold text-xs mt-2 animate-pulse uppercase tracking-wider">Kontrol Sende</span>
                </div>
            </div>

            {/* ALT OYUNCU (CHASER) CONTROLLER */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none">
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-auto">
                     <span className="text-slate-400 font-bold text-xs mb-2 uppercase tracking-wider">Elif'i Yakala</span>
                     <div 
                       ref={chaserBaseRef}
                       onMouseDown={(e) => handleMouseDown(e, 'chaser')}
                       className="w-24 h-24 rounded-full bg-slate-200/50 border-4 border-slate-300 backdrop-blur-sm relative flex items-center justify-center shadow-xl cursor-pointer"
                     >
                        <div 
                          ref={chaserKnobRef}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg border-2 border-white/50"
                        />
                     </div>
                </div>
            </div>

            {/* ORTAK SAYAÇ */}
            <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none z-20">
                <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm border border-rose-100 flex flex-col items-center justify-center min-w-[50px]">
                    <span className="text-[8px] font-bold text-rose-400 uppercase tracking-wider mb-0.5">SÜRE</span>
                    <span className="font-mono text-sm font-bold text-slate-700 leading-none">{tripDuration}s</span>
                </div>
            </div>
            
            <div className="absolute bottom-2 left-2 pointer-events-none opacity-40">
                <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded text-[10px]">
                    <MousePointer2 size={10} />
                    <span>Mouse / WASD / Yön Tuşları</span>
                </div>
            </div>
        </>
      )}

      {/* MENÜ */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 z-30 animate-fade-in text-center">
          <div className="flex gap-8 mb-8">
             <div className="flex flex-col items-center p-4 bg-rose-50 rounded-2xl border border-rose-100 transform rotate-180">
                <img src="https://i.imgur.com/waEyaQR.jpeg" className="w-16 h-16 rounded-full object-cover border-2 border-rose-200 mb-2 shadow-sm" alt="Elif" />
                <span className="text-xs font-bold text-rose-500 uppercase">Elif (Üst)</span>
                <span className="text-[10px] text-slate-400 mt-1">Tuşlar: W,A,S,D</span>
                <Move className="text-rose-300 mt-2" size={20} />
             </div>
             <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <img src="https://i.imgur.com/905saAD.jpeg" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 mb-2 shadow-sm" alt="Kamil" />
                <span className="text-xs font-bold text-slate-600 uppercase">Kamil (Alt)</span>
                <span className="text-[10px] text-slate-400 mt-1">Tuşlar: Oklar</span>
                <Move className="text-slate-300 mt-2" size={20} />
             </div>
          </div>
          
          <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">Trip Simülatörü</h2>
          <p className="text-slate-500 mb-8 max-w-xs text-sm">
            Telefonu masanın ortasına koyun. <br/>
            Joystickleri kullanarak birbirinizi kovalayın.
          </p>
          <button 
            onClick={startGame}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all"
          >
            Başla
          </button>
           <button 
            onClick={onBack}
            className="mt-4 text-slate-400 font-medium text-sm"
          >
            Çıkış
          </button>
        </div>
      )}

      {/* YAKALANMA (TRIP EKRANI) */}
      {gameState === 'caught' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-3xl p-6 w-full shadow-2xl animate-fade-in-up border-4 border-rose-200 relative overflow-hidden">
             
             <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-rose-600">YAKALANDIN!</h3>
                <p className="text-slate-500 text-sm">Ne diyeceksin?</p>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <button onClick={() => handleTripOption('git')} className="p-4 bg-slate-100 rounded-xl hover:bg-rose-50 border border-slate-200 font-bold text-slate-700 active:scale-95 transition-all">
                 Git
               </button>

               <button onClick={() => handleTripOption('hih')} className="p-4 bg-slate-100 rounded-xl hover:bg-rose-50 border border-slate-200 font-bold text-slate-700 active:scale-95 transition-all">
                 Hıh!
               </button>

               <button onClick={() => handleTripOption('istemiyorum')} className="p-4 bg-slate-100 rounded-xl hover:bg-rose-50 border border-slate-200 font-bold text-slate-700 active:scale-95 transition-all">
                 İstemiyorum
               </button>
               
               <button onClick={() => handleTripOption('gel')} className="p-4 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all">
                 Tamam gel
               </button>
             </div>
           </div>
        </div>
      )}

      {/* BARIŞMA */}
      {gameState === 'reconciled' && (
        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 z-50 animate-fade-in text-center">
           <Heart size={80} className="text-rose-500 animate-bounce mb-4 fill-rose-500" />
           <h2 className="text-3xl font-bold text-slate-800 mb-2">Aşk Kazandı!</h2>
           <p className="text-slate-500 mb-6">
             {tripDuration} saniye dayandınız.
           </p>
           <button onClick={startGame} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold mb-3">Tekrar Oyna</button>
           <button onClick={onBack} className="text-slate-400 font-medium">Menüye Dön</button>
        </div>
      )}

    </div>
  );
};

export default TripRunGame;