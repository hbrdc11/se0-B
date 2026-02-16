import React, { useState, useEffect, useRef } from 'react';
import { Heart, Diamond, Club, Spade, Hand, Trophy, RefreshCw, ArrowLeft } from 'lucide-react';

// --- TYPES ---
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

// Ortadaki kartların görsel pozisyonunu tutmak için
interface BoardCard {
  card: Card;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

interface Player {
  id: 'top' | 'bottom';
  name: string;
  deck: Card[];
}

interface PenaltyState {
  active: boolean;
  cardsNeeded: number;
  beneficiary: 'top' | 'bottom';
}

type GamePhase = 'init' | 'playing' | 'game_over';

interface KentGameProps {
  onBack: () => void;
}

// --- CONSTANTS ---
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// --- HELPER FUNCTIONS ---
const getRankValue = (rank: Rank): number => {
  const map: Record<Rank, number> = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };
  return map[rank];
};

const getFaceCardPenalty = (rank: Rank): number => {
  if (rank === 'A') return 4;
  if (rank === 'K') return 3;
  if (rank === 'Q') return 2;
  if (rank === 'J') return 1;
  return 0;
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: getRankValue(rank)
      });
    });
  });
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// --- COMPONENT ---
const KentGame: React.FC<KentGameProps> = ({ onBack }) => {
  // Game State
  const [bottomPlayer, setBottomPlayer] = useState<Player>({ id: 'bottom', name: 'Sen', deck: [] });
  const [topPlayer, setTopPlayer] = useState<Player>({ id: 'top', name: 'O', deck: [] });
  
  // Center Pile holds BoardCard (card + visual properties)
  const [centerPile, setCenterPile] = useState<BoardCard[]>([]);
  
  const [turn, setTurn] = useState<'top' | 'bottom'>('bottom');
  const [phase, setPhase] = useState<GamePhase>('init');
  const [penalty, setPenalty] = useState<PenaltyState>({ active: false, cardsNeeded: 0, beneficiary: 'bottom' });
  
  const [slapAvailable, setSlapAvailable] = useState(false);
  
  // --- INITIALIZATION ---
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const fullDeck = createDeck();
    const mid = Math.floor(fullDeck.length / 2);
    
    setBottomPlayer({ id: 'bottom', name: 'Sen', deck: fullDeck.slice(0, mid) });
    setTopPlayer({ id: 'top', name: 'O', deck: fullDeck.slice(mid) });
    setCenterPile([]);
    setTurn('bottom'); // Bottom player starts
    setPhase('playing');
    setPenalty({ active: false, cardsNeeded: 0, beneficiary: 'bottom' });
    setSlapAvailable(false);
  };

  // --- SLAP CHECK LOGIC ---
  const checkSlapCondition = (pile: BoardCard[]) => {
    if (pile.length < 2) return false;
    
    const top = pile[pile.length - 1].card;
    const under = pile[pile.length - 2].card;

    // 1. Aynı Kart (Pair)
    if (top.rank === under.rank) return true;

    // 2. Ardışık (Consecutive)
    if (Math.abs(top.value - under.value) === 1) return true;

    // 3. Toplamı 10
    if (top.value < 10 && under.value < 10 && (top.value + under.value === 10)) return true;

    // 4. Sandviç (Sandwich) - (e.g. 7 - 4 - 7)
    if (pile.length >= 3) {
      const sand = pile[pile.length - 3].card;
      if (top.rank === sand.rank) return true;
    }

    return false;
  };

  // --- GAME ACTIONS ---

  const playCard = (actorId: 'top' | 'bottom') => {
    if (phase !== 'playing') return;
    if (slapAvailable) return; // Cannot play if slap is pending
    if (turn !== actorId) return; // Not your turn

    let actor = actorId === 'bottom' ? bottomPlayer : topPlayer;
    let opponent = actorId === 'bottom' ? topPlayer : bottomPlayer;

    if (actor.deck.length === 0) {
      handleGameOver(opponent.id); 
      return;
    }

    // 1. Move card
    const card = actor.deck[0];
    const newDeck = actor.deck.slice(1);
    
    if (actorId === 'bottom') setBottomPlayer(prev => ({ ...prev, deck: newDeck }));
    else setTopPlayer(prev => ({ ...prev, deck: newDeck }));

    // Generate random visual position for the card on the board
    const newBoardCard: BoardCard = {
        card,
        rotation: (Math.random() * 40) - 20, // -20 to 20 degrees
        offsetX: (Math.random() * 20) - 10,  // -10 to 10 px x-offset
        offsetY: (Math.random() * 20) - 10   // -10 to 10 px y-offset
    };

    const newPile = [...centerPile, newBoardCard];
    setCenterPile(newPile);

    // 2. Check for Face Card (Penalty Interrupt)
    const penaltyValue = getFaceCardPenalty(card.rank);
    
    if (penaltyValue > 0) {
      setPenalty({
        active: true,
        cardsNeeded: penaltyValue,
        beneficiary: actorId
      });
      // Face card played usually pauses pure slap logic in strict rules, 
      // but "Kanlı Para" usually allows slapping pairs anytime.
      // We will allow slapping if condition meets, otherwise proceed with penalty.
      const isSlap = checkSlapCondition(newPile);
      if (isSlap) {
          setSlapAvailable(true);
      } else {
          setSlapAvailable(false);
          setTurn(actorId === 'bottom' ? 'top' : 'bottom');
      }
    } 
    else {
      // Numeric Card
      if (penalty.active) {
        // Paying penalty
        const remaining = penalty.cardsNeeded - 1;
        
        // Check slap even during penalty
        const isSlap = checkSlapCondition(newPile);
        
        if (isSlap) {
             setSlapAvailable(true);
        } else if (remaining > 0) {
            setPenalty(prev => ({ ...prev, cardsNeeded: remaining }));
            // Turn stays with payer
        } else {
            // Penalty Paid & Failed to Counter -> Beneficiary takes pile!
            setTimeout(() => collectPile(penalty.beneficiary, newPile), 700);
            return; 
        }
      } else {
        // Normal Play -> Check Slap
        const isSlap = checkSlapCondition(newPile);
        if (isSlap) {
          setSlapAvailable(true);
        } else {
          setSlapAvailable(false);
          // Switch turn
          setTurn(actorId === 'bottom' ? 'top' : 'bottom');
        }
      }
    }
  };

  const collectPile = (winnerId: 'top' | 'bottom', pileToCollect: BoardCard[] = centerPile) => {
    const winner = winnerId === 'bottom' ? bottomPlayer : topPlayer;
    // Extract just the card data back from BoardCard
    const collectedCards = pileToCollect.map(bc => bc.card);
    const newDeck = [...winner.deck, ...collectedCards];
    
    if (winnerId === 'bottom') setBottomPlayer(prev => ({ ...prev, deck: newDeck }));
    else setTopPlayer(prev => ({ ...prev, deck: newDeck }));
    
    setCenterPile([]);
    setPenalty({ active: false, cardsNeeded: 0, beneficiary: 'bottom' });
    setSlapAvailable(false);
    
    // Winner starts next round
    setTurn(winnerId);
  };

  const handleSlap = (slapperId: 'top' | 'bottom') => {
    if (!slapAvailable) return;
    collectPile(slapperId);
  };

  const handleGameOver = (winnerId: 'top' | 'bottom') => {
    setPhase('game_over');
  };

  // --- UI RENDERING ---

  const getSuitIcon = (suit: Suit) => {
      switch (suit) {
          case 'hearts': return <Heart className="fill-rose-500 text-rose-500 inline-block" size={24} />;
          case 'diamonds': return <Diamond className="fill-rose-500 text-rose-500 inline-block" size={24} />;
          case 'clubs': return <Club className="fill-slate-800 text-slate-800 inline-block" size={24} />;
          case 'spades': return <Spade className="fill-slate-800 text-slate-800 inline-block" size={24} />;
      }
  };

  const renderCard = (card: Card, isFaceUp: boolean, small = false) => {
      if (!isFaceUp) {
          return (
            <div className={`bg-rose-700 rounded-lg border-2 border-white flex items-center justify-center relative shadow-md ${small ? 'w-16 h-24' : 'w-20 h-28'}`}>
                 <div className={`border border-rose-400/30 rounded flex items-center justify-center ${small ? 'w-12 h-20' : 'w-16 h-24'}`}>
                    <span className="text-rose-900 font-bold opacity-20 text-xl">KENT</span>
                 </div>
            </div>
          );
      }
      return (
        <div className="w-24 h-36 bg-white rounded-xl shadow-lg border border-slate-300 flex flex-col justify-between p-2">
           <div className="font-bold text-2xl text-slate-800 leading-none">{card.rank}</div>
           <div className="self-center transform scale-150">{getSuitIcon(card.suit)}</div>
           <div className="font-bold text-2xl text-slate-800 leading-none self-end rotate-180">{card.rank}</div>
        </div>
      );
  };

  // --- GAME OVER SCREEN ---
  if (phase === 'game_over') {
    const isBottomWin = bottomPlayer.deck.length > 0;
    return (
        <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-6 animate-fade-in">
            <Trophy size={64} className="text-yellow-400 mb-6 animate-bounce" />
            <h2 className="text-4xl font-serif font-bold mb-2 text-center">
                {isBottomWin ? "AŞAĞI KAZANDI!" : "YUKARI KAZANDI!"}
            </h2>
            <div className="flex gap-4 mt-8">
                <button onClick={startNewGame} className="flex items-center gap-2 bg-rose-600 px-6 py-3 rounded-xl font-bold shadow-lg">
                    <RefreshCw size={20} /> Tekrar Oyna
                </button>
                <button onClick={onBack} className="flex items-center gap-2 bg-slate-700 px-6 py-3 rounded-xl font-bold">
                    <ArrowLeft size={20} /> Çıkış
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#35654d] relative overflow-hidden flex flex-col font-sans select-none touch-manipulation">
        {/* Table Texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        {/* --- TOP PLAYER AREA (Rotated) --- */}
        <div className="h-1/3 w-full relative flex justify-center items-start pt-8 transform rotate-180">
            <div className="relative">
                {/* Top Deck */}
                <button 
                    onClick={() => playCard('top')}
                    disabled={turn !== 'top' || slapAvailable}
                    className={`relative transition-all duration-150 active:scale-95 ${turn === 'top' && !slapAvailable ? 'ring-4 ring-yellow-400 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'opacity-80'}`}
                >
                    {topPlayer.deck.length > 0 ? (
                        renderCard({} as Card, false, true)
                    ) : (
                        <div className="w-16 h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center"><span className="text-xs text-white/50">Bitti</span></div>
                    )}
                    
                    {/* Count Badge */}
                    <div className="absolute -bottom-6 w-full text-center text-white font-bold text-xs transform rotate-180">
                        {topPlayer.deck.length} Kart
                    </div>
                </button>

                 {/* Top Slap Button - Kartların Yanında */}
                 {slapAvailable && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleSlap('top'); }}
                        className="absolute -right-24 top-0 bg-rose-600 text-white w-20 h-20 rounded-full flex flex-col items-center justify-center font-black border-4 border-white shadow-xl animate-pulse active:bg-rose-800 active:scale-95 z-50"
                    >
                        <Hand size={24} />
                        <span className="text-xs mt-1">VUR</span>
                    </button>
                )}
            </div>
        </div>


        {/* --- CENTER PILE --- */}
        <div className="flex-1 flex items-center justify-center relative z-0">
             {/* Center Pile Cards */}
             <div className="relative w-32 h-48 flex items-center justify-center">
                {centerPile.length === 0 && (
                     <div className="w-24 h-36 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center opacity-30">
                         <span className="text-white text-xs font-bold">BOŞ</span>
                     </div>
                )}
                {centerPile.map((boardCard, idx) => {
                    // Show only last 5 cards to prevent DOM overload, but keep stack logic
                    if (idx < centerPile.length - 5) return null;
                    
                    return (
                        <div 
                            key={boardCard.card.id}
                            className="absolute transition-transform duration-200"
                            style={{ 
                                transform: `translate(${boardCard.offsetX}px, ${boardCard.offsetY}px) rotate(${boardCard.rotation}deg) scale(${idx === centerPile.length -1 ? 1.1 : 1})`,
                                zIndex: idx
                            }}
                        >
                            {renderCard(boardCard.card, true)}
                        </div>
                    );
                })}
             </div>
        </div>


        {/* --- BOTTOM PLAYER AREA --- */}
        <div className="h-1/3 w-full relative flex justify-center items-end pb-8">
            <div className="relative">
                {/* Bottom Deck */}
                <button 
                    onClick={() => playCard('bottom')}
                    disabled={turn !== 'bottom' || slapAvailable}
                    className={`relative transition-all duration-150 active:scale-95 ${turn === 'bottom' && !slapAvailable ? 'ring-4 ring-yellow-400 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'opacity-80'}`}
                >
                    {bottomPlayer.deck.length > 0 ? (
                        renderCard({} as Card, false, true)
                    ) : (
                         <div className="w-16 h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center"><span className="text-xs text-white/50">Bitti</span></div>
                    )}
                    
                    {/* Count Badge */}
                    <div className="absolute -top-6 w-full text-center text-white font-bold text-xs">
                        {bottomPlayer.deck.length} Kart
                    </div>
                </button>

                {/* Bottom Slap Button - Kartların Yanında */}
                {slapAvailable && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleSlap('bottom'); }}
                        className="absolute -right-24 bottom-0 bg-rose-600 text-white w-20 h-20 rounded-full flex flex-col items-center justify-center font-black border-4 border-white shadow-xl animate-pulse active:bg-rose-800 active:scale-95 z-50"
                    >
                        <Hand size={24} />
                        <span className="text-xs mt-1">VUR</span>
                    </button>
                )}
            </div>
        </div>

        {/* Back Button (Top Left) */}
        <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/20 rounded-full text-white hover:bg-black/40 z-50">
            <ArrowLeft size={20} />
        </button>

    </div>
  );
};

export default KentGame;