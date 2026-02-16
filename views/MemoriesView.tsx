import React, { useState, useRef } from 'react';
import { Memory } from '../types';
import { ImagePlus, X, Heart } from 'lucide-react';

const MemoriesView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATE ---
  const [selectedCategory, setSelectedCategory] = useState<string>('Hepsi');
  const [selectedImage, setSelectedImage] = useState<Memory | null>(null);

  // Kategoriler: Biz (Çift), Sen (Tekli), Çiçekler (Buket), Anlar (Komik/Doğal)
  const categories = ['Hepsi', 'Biz', 'Sen', 'Çiçekler', 'Anlar'];

  // Kullanıcı tarafından sağlanan Imgur linkleri
  const imgurIds = [
    'YkD73Ac', 'o2CacLx', 'ZVwB9Dc', 'WSh0Xbj', '6AT4hiV', 'EBCzdXk', 'lNzV20v', 'JfffmK5',
    'dGP4AxR', '5e1XGH1', 'dhSWbYX', '0TJ9X1M', '0R05J7J', 'rT9y3wJ', 'GFulWL8', '6CKWmMQ',
    'ZEQgDey', 'CDsWeEf', 'jJAi7df', 'jM6I1iU', 'SuqFlq3', 'yw22ygp', 'U6qYzkN', 'NZz08Aw',
    '7pzyIxu', '9J4uImn', 'nZqw2oF', 'sDGDQ72', 'nyVtb20', 'iXbe8gO', 'xRgCbu2', 'KodEW3c',
    'CLRpPog', 'q8Or1g1', 'Yv4zUXW', 'yj3AwcC', 'S48eDBs', '0SBo3ng', '1Aq0H93', 'Bk1fxAh',
    'cFkO4q9', 'R1nHrFz'
  ];

  // Linkleri Memory objelerine dönüştür ve kategorilere dağıt
  const initialMemories: Memory[] = imgurIds.map((id, index) => {
    // Kategorileri sırayla dağıt (Dengeli görünüm için)
    // Gerçekte içeriğe göre elle düzenlenebilir
    const categoryList = ['Biz', 'Sen', 'Çiçekler', 'Anlar'];
    const category = categoryList[index % categoryList.length];
    
    return {
      id: id,
      url: `https://i.imgur.com/${id}.jpeg`, // Direct image link
      caption: 'Güzel Bir Anı',
      date: '2023-2024',
      category: category
    };
  });

  const [memories, setMemories] = useState<Memory[]>(initialMemories);

  // --- ACTIONS ---

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newMemories: Memory[] = Array.from(files).map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file), 
        caption: 'Yeni Yüklenen',
        date: new Date().toLocaleDateString('tr-TR'),
        category: 'Anlar' // Varsayılan olarak 'Anlar' kategorisine eklenir
      }));

      // Yeni yüklenenleri başa ekle
      setMemories((prev) => [...newMemories, ...prev]);
    }
  };

  const openLightbox = (memory: Memory) => {
    setSelectedImage(memory);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  // --- FILTERING ---
  const filteredMemories = selectedCategory === 'Hepsi' 
    ? memories 
    : memories.filter(m => m.category === selectedCategory);

  return (
    <div className="h-full flex flex-col pb-24 bg-white dark:bg-slate-950 min-h-screen transition-colors duration-500">
      
      {/* HEADER */}
      <div className="pt-2 px-4 pb-4 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-30 border-b border-slate-100 dark:border-slate-800 transition-colors duration-500">
        <div>
           <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100">Galerimiz</h2>
           <p className="text-xs text-slate-500 dark:text-slate-400">{memories.length} fotoğraf biriktirdik</p>
        </div>
        
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <button 
          onClick={handleTriggerUpload}
          className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform"
        >
          <ImagePlus size={18} />
          Ekle
        </button>
      </div>

      {/* CATEGORY TABS */}
      <div className="px-4 mb-2 overflow-x-auto scrollbar-hide flex gap-2 sticky top-[70px] bg-white dark:bg-slate-950 z-20 py-3 border-b border-slate-50 dark:border-slate-900 transition-colors duration-500">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shadow-sm border ${
              selectedCategory === cat 
                ? 'bg-rose-500 text-white border-rose-500 shadow-rose-200 dark:shadow-none' 
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PHOTO GRID (INSTAGRAM STYLE - 3 Sütun) */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 text-slate-400 dark:text-slate-600">
            <ImagePlus size={48} className="mb-4 opacity-30" />
            <p className="text-center text-sm">Bu kategoride fotoğraf yok.</p>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-0.5 pb-20">
            {filteredMemories.map((memory) => (
                <div 
                key={memory.id} 
                onClick={() => openLightbox(memory)}
                className="relative aspect-square group cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-800"
                >
                <img 
                    src={memory.url} 
                    alt={memory.caption} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                {/* Dokunma efekti */}
                <div className="absolute inset-0 bg-black/10 opacity-0 active:opacity-100 transition-opacity" />
                </div>
            ))}
            </div>
        )}
      </div>

      {/* LIGHTBOX (POPUP) */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black animate-fade-in flex flex-col">
           {/* Top Bar */}
           <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
             <span className="text-white/80 text-xs font-medium">{selectedImage.date}</span>
             <button 
                onClick={closeLightbox}
                className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md"
             >
                <X size={24} />
             </button>
           </div>

           {/* Image */}
           <div className="flex-1 flex items-center justify-center bg-black relative">
             <img 
               src={selectedImage.url} 
               alt={selectedImage.caption}
               className="max-w-full max-h-full object-contain"
             />
           </div>

           {/* Bottom Bar (Caption & Category) */}
           <div className="bg-black/80 backdrop-blur-xl p-6 text-white pb-10 border-t border-white/10">
              <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {selectedImage.caption || 'Bizim Anımız'}
                    </h3>
                    <span className="text-rose-400 text-xs font-bold uppercase tracking-widest mt-1 block">
                      {selectedImage.category}
                    </span>
                  </div>
                  <button className="text-rose-500">
                      <Heart className="fill-rose-500" size={28} />
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default MemoriesView;