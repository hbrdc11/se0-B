import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, MapPin } from 'lucide-react';

interface LocationSpot {
  id: number;
  title: string;
  description: string;
  coords: string; // Latitude,Longitude
  label: string;
}

const locations: LocationSpot[] = [
  {
    id: 1,
    title: "İlk Görüş",
    description: "Lisenin oradaki park... Biliyor musun seni orada gördüğümde kalbim yerinden çıkacak gibi olmuştu. Hikayemizin başladığı, gözlerinin gözlerime değdiği o büyülü nokta.",
    coords: "38.482194,27.212675", 
    label: "Seni ilk gördüğüm yer"
  },
  {
    id: 2,
    title: "Huzur Köşemiz",
    description: "Göğsüme yaslandığın o bank... Senin kokun, nefesin ve varlığınla dolup taştığım, zamanın durmasını dilediğim, bana evimde hissettiren o eşsiz an.",
    coords: "38.481305,27.210989", 
    label: "Göğsüme ilk uzandığın yer"
  },
  {
    id: 3,
    title: "Büyülü An",
    description: "Dudaklarımızın ilk kez buluştuğu o saniye... Dünyadaki her şey silindi, sadece sen ve ben kaldık. Aşkımızın en güzel mührünün vurulduğu yer.",
    coords: "38.481009,27.197477", 
    label: "Dudaklarımızın buluştuğu an"
  }
];

const MapView: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentLocation = locations[currentIndex];

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    setCurrentIndex((prev) => (prev + 1) % locations.length);
  };

  const handlePrev = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    setCurrentIndex((prev) => (prev - 1 + locations.length) % locations.length);
  };

  return (
    <div className="h-full flex flex-col pb-24">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Haritamız</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Aşkımızın geçtiği sokaklar.</p>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border-2 border-white dark:border-slate-700 relative group">
        
        {/* 
           Google Maps Embed 
        */}
        <div className="absolute top-[-20%] left-0 w-full h-[140%]">
          <iframe 
            key={currentLocation.id} // Force re-render on change
            src={`https://maps.google.com/maps?q=${currentLocation.coords}&z=19&t=k&iwloc=near&output=embed`}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className={`w-full h-full pointer-events-none transition-opacity duration-700 ${isAnimating ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}
          ></iframe>
        </div>

        {/* Custom Marker Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center pointer-events-none pb-1">
            <div className="relative drop-shadow-2xl filter hover:scale-110 transition-transform duration-300">
                <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] bg-rose-600 rounded-full"></div>
                <MapPin size={64} className="relative z-10 text-rose-600 fill-rose-600 drop-shadow-lg" strokeWidth={1.5} />
                <div className="absolute top-0 left-0 w-full h-[85%] z-20 flex items-center justify-center pt-1">
                   <Heart size={22} className="text-white fill-white animate-pulse" />
                </div>
            </div>
            
            {/* Floating Label */}
            <div className="absolute top-full mt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-rose-200 dark:border-slate-700 animate-fade-in-up whitespace-nowrap z-30">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    {currentLocation.label}
                </span>
            </div>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 z-30 pointer-events-none">
            <button 
                onClick={handlePrev}
                className="pointer-events-auto bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-rose-500 dark:text-rose-400 p-2 rounded-full shadow-lg backdrop-blur-sm transition-transform active:scale-90 border border-rose-100 dark:border-slate-700"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={handleNext}
                className="pointer-events-auto bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-rose-500 dark:text-rose-400 p-2 rounded-full shadow-lg backdrop-blur-sm transition-transform active:scale-90 border border-rose-100 dark:border-slate-700"
            >
                <ChevronRight size={24} />
            </button>
        </div>

      </div>

      {/* Description Widget */}
      <div className="mt-4 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-rose-100 dark:border-slate-700 flex items-start space-x-4 transition-all duration-300">
        <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-2xl min-w-12 min-h-12 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-inner">
            <Heart size={20} className={isAnimating ? 'animate-ping' : ''} fill="currentColor" />
        </div>
        <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{currentLocation.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {currentLocation.description}
            </p>
            <div className="mt-2 flex gap-1 justify-end">
                 {locations.map((_, idx) => (
                     <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-rose-400 dark:bg-rose-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
                 ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;