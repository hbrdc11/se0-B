import React, { useState, useEffect, useRef } from 'react';
import { Lock, PlayCircle, Music, Dices, ChevronLeft, PenTool, Download, RefreshCw, Eraser, Zap, Spade, Users, Club } from 'lucide-react';
import { Minigame } from '../types';
import TripRunGame from './TripRunGame';
import KentGame from './PistiGame';

interface GamesViewProps {
  onToggleFullScreen: (isFull: boolean) => void;
}

const GamesView: React.FC<GamesViewProps> = ({ onToggleFullScreen }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // --- KART OYUNLARI STATE ---
  const [showCardMenu, setShowCardMenu] = useState(true);

  // --- OYUN 1: AŞK ZARLARI STATE ---
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState({ action: '?', target: '?' });
  const ACTIONS = ['Kocaman Öp', 'Hafifçe Isır', 'Kokla', 'Masaj Yap', 'Yala', 'Gıdıkla'];
  const TARGETS = ['Boynumdan', 'Dudağımdan', 'Yanağımdan', 'Kulağımdan', 'Omzumdan', 'Elimden'];

  // --- OYUN 2: BİRLİKTE ÇİZ STATE ---
  const [drawStep, setDrawStep] = useState<'intro' | 'playing' | 'result'>('intro');
  const [drawTopic, setDrawTopic] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Canvas Refs
  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Saved Images Data (Base64)
  const [p1Image, setP1Image] = useState<string | null>(null);
  const [p2Image, setP2Image] = useState<string | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const DRAW_TOPICS = [
    'Yarım Kalp (Sen Solu, Ben Sağı) ❤️',
    'Ruh Eşleri (Yüzümüzün Yarısı) 👩‍❤️‍👨',
    'Gökkuşağının İki Ucu 🌈',
    'Aramızdaki Köprü 🌉'
  ];

  const games: Minigame[] = [
    { id: 'dice', title: 'Zarlarımız', description: 'Şansımıza ne çıkacak bakalım?', icon: 'dices', isLocked: false },
    { id: 'draw', title: 'Birlikte Çiz', description: 'Ekranın iki ucundan ortak sanatımız.', icon: 'pen', isLocked: false },
    { id: 'trip', title: 'Trip Kaçışı', description: 'Olamaz! Çok kızmış. Yakala ve gönlünü al.', icon: 'zap', isLocked: false },
    { id: 'cards', title: 'Kart Oyunu', description: 'Kent (2 Kişilik / Aynı Cihaz)', icon: 'cards', isLocked: false },
    { id: 'songs', title: 'Şarkılarımız', description: 'Bizi anlatan notalar (Yakında)', icon: 'music', isLocked: true },
  ];

  // --- GENEL OYUN MANTIKLARI ---

  const handleGameClick = (game: Minigame) => {
    if (!game.isLocked) {
      setActiveGame(game.id);
      onToggleFullScreen(true); 
      // Reset states
      setDiceResult({ action: '?', target: '?' });
      setDrawStep('intro');
      setP1Image(null);
      setP2Image(null);
      setShowCardMenu(true);
    }
  };

  const handleBack = () => {
    if (activeGame === 'cards' && !showCardMenu) {
        setShowCardMenu(true);
        return;
    }
    setActiveGame(null);
    onToggleFullScreen(false);
  };

  // --- ZAR MANTIĞI ---
  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let counter = 0;
    const interval = setInterval(() => {
      setDiceResult({
        action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
        target: TARGETS[Math.floor(Math.random() * TARGETS.length)]
      });
      counter++;
      if (counter > 12) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 100);
  };

  // --- ÇİZİM MANTIĞI ---
  
  const startDrawGame = () => {
    const randomTopic = DRAW_TOPICS[Math.floor(Math.random() * DRAW_TOPICS.length)];
    setDrawTopic(randomTopic);
    setP1Image(null);
    setP2Image(null);
    setDrawStep('playing');
    setTimeLeft(60);
  };

  const setupCanvas = (canvas: HTMLCanvasElement) => {
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#e11d48'; 
      ctx.lineWidth = 4;
    }

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };

  useEffect(() => {
    if (drawStep === 'playing') {
      setTimeout(() => {
        if (canvasRef1.current) setupCanvas(canvasRef1.current);
        if (canvasRef2.current) setupCanvas(canvasRef2.current);
      }, 100);
    }
  }, [drawStep, activeGame]);

  useEffect(() => {
    let timer: any;
    if (activeGame === 'draw' && drawStep === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && drawStep === 'playing') {
      finishDrawing();
    }
    return () => clearInterval(timer);
  }, [timeLeft, drawStep, activeGame]);

  const finishDrawing = () => {
    if (canvasRef1.current && canvasRef2.current) {
      setP1Image(canvasRef1.current.toDataURL());
      setP2Image(canvasRef2.current.toDataURL());
      setDrawStep('result');
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawingFn = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawFn = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement | null) => {
    if (!isDrawing || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingFn = () => {
    setIsDrawing(false);
  };

  const mergeImages = () => {
    if (!resultCanvasRef.current || !p1Image || !p2Image) return;
    const canvas = resultCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img1 = new Image();
    const img2 = new Image();

    img1.src = p1Image;
    img2.src = p2Image;

    img1.onload = () => {
      canvas.width = img1.width + img2.width; 
      canvas.height = Math.max(img1.height, img2.height);

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img1, 0, 0);
      
      img2.onload = () => {
        ctx.drawImage(img2, img1.width, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `bizim-eserimiz-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      };
    };
  };

  // --- RENDER FONKSİYONLARI ---

  // 1. ZAR OYUNU
  const renderDiceGame = () => (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400 mb-4 shadow-inner">
            <Dices size={40} />
          </div>
          <h3 className="text-3xl font-serif font-bold text-rose-900 dark:text-rose-100">Aşk Zarları</h3>
          <p className="text-rose-400 font-medium">Bakalım kaderinde ne var sevgilim?</p>
        </div>

        <div className="flex gap-4 w-full px-4">
          <div className={`flex-1 aspect-square bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-800 rounded-3xl flex items-center justify-center shadow-xl shadow-rose-200 dark:shadow-rose-900/40 transform transition-all duration-200 ${isRolling ? 'rotate-6 scale-95' : ''}`}>
            <p className="text-white font-bold text-xl text-center px-2 leading-tight drop-shadow-md">
              {diceResult.action}
            </p>
          </div>
          <div className={`flex-1 aspect-square bg-slate-800 dark:bg-slate-700 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-300 dark:shadow-slate-900 transform transition-all duration-200 delay-75 ${isRolling ? '-rotate-6 scale-95' : ''}`}>
            <p className="text-white font-bold text-xl text-center px-2 leading-tight">
              {diceResult.target}
            </p>
          </div>
        </div>

        <button
          onClick={rollDice}
          disabled={isRolling}
          className={`w-4/5 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 ${
            isRolling ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500' : 'bg-rose-600 dark:bg-rose-700 text-white shadow-rose-300 dark:shadow-rose-900/50 hover:bg-rose-700 dark:hover:bg-rose-600'
          }`}
        >
          {isRolling ? 'Zarlar Dönüyor...' : 'Şansımızı Dene'}
        </button>
      </div>
    </div>
  );

  // 2. ÇİZİM OYUNU
  const renderDrawGame = () => {
    if (drawStep === 'intro') {
      return (
        <div className="flex flex-col h-full items-center justify-center text-center p-4 space-y-6 animate-fade-in">
          <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-lg">
            <PenTool size={48} />
          </div>
          <div>
            <h3 className="text-3xl font-serif font-bold text-slate-800 dark:text-slate-100">Birlikte Çiz</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              Telefonu masaya koyun ve karşılıklı geçin.<br/>
              Biriniz <strong>SOL</strong> yarıyı, diğeriniz <strong>SAĞ</strong> yarıyı çizecek!<br/>
              (Ekran birleştiğinde yan yana gelecek)
            </p>
          </div>
          <button 
            onClick={startDrawGame}
            className="bg-rose-600 dark:bg-rose-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-rose-200 dark:shadow-rose-900/30 hover:bg-rose-700 transition-transform active:scale-95 flex items-center gap-2"
          >
            <PlayCircle size={24} /> Başlayalım
          </button>
        </div>
      );
    }

    if (drawStep === 'result') {
      return (
        <div className="flex flex-col h-full items-center pt-8 p-4 animate-fade-in overflow-y-auto bg-slate-50 dark:bg-slate-900">
           <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">İşte Eserimiz!</h3>
           <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Yan yana gelince nasıl durdu? :)</p>
           
           {/* Result Stack - SIDE BY SIDE DISPLAY */}
           <div className="border-4 border-slate-800 dark:border-slate-700 rounded-lg shadow-2xl w-full bg-white flex flex-row overflow-hidden h-64">
              {p1Image && (
                <div className="w-1/2 border-r border-dashed border-slate-200 relative bg-white h-full">
                  <img src={p1Image} alt="Sol Parça" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-rose-100 text-rose-500 text-[10px] px-2 py-1 rounded-md font-bold opacity-80">SOL</div>
                </div>
              )}
              {p2Image && (
                <div className="w-1/2 relative bg-white h-full">
                  <img src={p2Image} alt="Sağ Parça" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-blue-100 text-blue-500 text-[10px] px-2 py-1 rounded-md font-bold opacity-80">SAĞ</div>
                </div>
              )}
           </div>

           <div className="mt-8 flex flex-col w-full gap-3 pb-8">
              <button 
                onClick={mergeImages}
                className="bg-slate-800 dark:bg-slate-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <Download size={20} /> Birleşimi Kaydet
              </button>
              <button 
                onClick={startDrawGame}
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw size={20} /> Tekrar Oyna
              </button>
           </div>
           
           {/* Hidden Canvas for merging */}
           <canvas ref={resultCanvasRef} className="hidden" />
        </div>
      );
    }

    // PLAYING STATE - NOTE: Canvas remains white like paper
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
        {/* TOP PLAYER AREA (Rotated 180deg) -> Represents LEFT part of final image */}
        <div className="flex-1 bg-white relative border-b-2 border-dashed border-rose-200 w-full overflow-hidden">
          <div className="absolute inset-0 transform rotate-180 bg-white">
             {/* Label */}
             <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none opacity-40 z-10">
               <span className="text-xs font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-full">Resmin Solu (Sen)</span>
             </div>
             
             <canvas 
                ref={canvasRef1}
                className="block touch-none cursor-crosshair"
                onTouchStart={(e) => startDrawingFn(e, canvasRef1.current)}
                onTouchMove={(e) => drawFn(e, canvasRef1.current)}
                onTouchEnd={stopDrawingFn}
                onMouseDown={(e) => startDrawingFn(e, canvasRef1.current)}
                onMouseMove={(e) => drawFn(e, canvasRef1.current)}
                onMouseUp={stopDrawingFn}
                onMouseLeave={stopDrawingFn}
             />
          </div>
        </div>

        {/* CENTER INFO BAR */}
        <div className="h-14 bg-slate-800 dark:bg-slate-900 flex items-center justify-between px-4 z-20 shadow-lg text-white flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs text-slate-400 flex-shrink-0">Konu:</span>
            <span className="font-bold text-xs truncate text-rose-300 max-w-[150px]">{drawTopic}</span>
          </div>
          <div className="flex items-center gap-3 pl-2">
            <div className={`font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </div>
            <button 
               onClick={finishDrawing}
               className="text-xs bg-rose-600 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-700 transition-colors"
            >
              Bitir
            </button>
          </div>
        </div>

        {/* BOTTOM PLAYER AREA (Normal) -> Represents RIGHT part of final image */}
        <div className="flex-1 bg-white relative w-full overflow-hidden">
           <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none opacity-40 z-10">
               <span className="text-xs font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-full">Resmin Sağı (Ben)</span>
           </div>
           
           <canvas 
              ref={canvasRef2}
              className="block touch-none cursor-crosshair"
              onTouchStart={(e) => startDrawingFn(e, canvasRef2.current)}
              onTouchMove={(e) => drawFn(e, canvasRef2.current)}
              onTouchEnd={stopDrawingFn}
              onMouseDown={(e) => startDrawingFn(e, canvasRef2.current)}
              onMouseMove={(e) => drawFn(e, canvasRef2.current)}
              onMouseUp={stopDrawingFn}
              onMouseLeave={stopDrawingFn}
           />
        </div>
      </div>
    );
  };

  // 3. KART OYUNLARI MENÜSÜ & OYUNLARI
  const renderCardGameMenu = () => (
    <div className="flex flex-col h-full animate-fade-in p-6 bg-white dark:bg-slate-900 transition-colors">
       <div className="text-center mb-8 mt-4">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
             <Spade size={40} />
          </div>
          <h3 className="text-3xl font-serif font-bold text-slate-800 dark:text-slate-100">Kent</h3>
          <p className="text-slate-500 dark:text-slate-400">2 Kişilik / Aynı Cihaz</p>
       </div>

       <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => setShowCardMenu(false)}
            className="group relative h-32 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all overflow-hidden flex items-center justify-between px-6"
          >
             <div className="relative z-10 text-left">
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Kent Başlat</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">Telefonu ortaya koyun!</p>
             </div>
             <div className="w-16 h-24 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center justify-center transform rotate-6 group-hover:rotate-12 transition-transform">
                <span className="text-3xl text-red-500 dark:text-red-400">K</span>
             </div>
          </button>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs text-slate-500 dark:text-slate-400 space-y-2">
             <p className="font-bold text-slate-700 dark:text-slate-300">Kurallar:</p>
             <ul className="list-disc pl-4 space-y-1">
                <li>Telefonu masaya koyun, karşılıklı geçin.</li>
                <li>Kart atmak için destenize dokunun.</li>
                <li>Aynı kart, ardışık veya toplam 10 olunca kartlarınızın yanında <strong>VUR</strong> butonu çıkar.</li>
                <li>İlk vuran ortayı alır!</li>
                <li><strong>Cezalar:</strong> As(4), Papaz(3), Kız(2), Vale(1)</li>
             </ul>
          </div>
       </div>
    </div>
  );

  // --- ANA EKRAN RENDER ---
  return (
    <div className={`space-y-6 relative flex flex-col ${activeGame ? 'h-[calc(100vh-140px)]' : 'pb-24'}`}>
      {/* HEADER ALANI */}
      <div className="flex items-center space-x-2 min-h-[40px] flex-shrink-0">
        {activeGame ? (
          <button 
            onClick={handleBack}
            className="flex items-center text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 mr-2">
              <ChevronLeft size={20} />
            </div>
            <span className="font-medium text-sm">
                {activeGame === 'cards' && !showCardMenu ? 'Lobiye Dön' : 'Geri Dön'}
            </span>
          </button>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Bizim Dünyamız</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Seninle her an çok güzel...</p>
          </div>
        )}
      </div>

      {/* İÇERİK ALANI */}
      <div className="relative flex-1 flex flex-col">
        {activeGame === null ? (
          /* OYUN LİSTESİ */
          <div className="space-y-4 animate-fade-in">
            {games.map((game) => (
              <button 
                key={game.id}
                onClick={() => handleGameClick(game)}
                disabled={game.isLocked}
                className={`w-full relative p-5 rounded-3xl flex items-center space-x-4 border transition-all text-left group ${
                  game.isLocked 
                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60 cursor-not-allowed' 
                    : 'bg-white dark:bg-slate-800 border-white dark:border-slate-700 shadow-sm hover:shadow-md hover:border-rose-100 dark:hover:border-rose-800 active:scale-[0.98]'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  game.isLocked 
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500' 
                    : 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-800/40'
                }`}>
                  {game.icon === 'music' && <Music size={26} />}
                  {game.icon === 'lock' && <Lock size={26} />}
                  {game.icon === 'dices' && <Dices size={26} />}
                  {game.icon === 'pen' && <PenTool size={26} />}
                  {game.icon === 'zap' && <Zap size={26} />}
                  {game.icon === 'cards' && <Spade size={26} />}
                </div>

                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${game.isLocked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                    {game.title}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{game.description}</p>
                </div>

                {!game.isLocked && (
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-400 group-hover:text-rose-400 group-hover:bg-white dark:group-hover:bg-slate-600 transition-all">
                    <PlayCircle size={20} />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          /* AKTİF OYUN GÖRÜNÜMÜ */
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 flex-1 relative transition-colors duration-500">
            {activeGame === 'dice' && (
               <div className="p-6 h-full">{renderDiceGame()}</div>
            )}
            {activeGame === 'draw' && renderDrawGame()}
            {activeGame === 'trip' && <TripRunGame onBack={handleBack} />}
            {activeGame === 'cards' && (
                <>
                    {showCardMenu ? renderCardGameMenu() : <KentGame onBack={() => setShowCardMenu(true)} />}
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesView;