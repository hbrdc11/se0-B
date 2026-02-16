import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { StickyNote, NoteCategory } from '../types';
import { noteService } from '../services/noteService';

const LetterView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('Hepsi');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>('Gelecek');
  const [newNoteColor, setNewNoteColor] = useState('bg-rose-200');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load notes from service (Real-time Firebase)
  const [notes, setNotes] = useState<StickyNote[]>([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = noteService.subscribeToNotes((fetchedNotes) => {
      setNotes(fetchedNotes);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const categories: NoteCategory[] = ['Hepsi', 'Gelecek', 'Anı', 'Rastgele'];
  const colors = [
    { name: 'Rose', class: 'bg-rose-200' },
    { name: 'Yellow', class: 'bg-amber-100' },
    { name: 'Blue', class: 'bg-sky-200' },
    { name: 'Green', class: 'bg-emerald-100' },
    { name: 'Purple', class: 'bg-violet-200' },
  ];

  const filteredNotes = selectedCategory === 'Hepsi' 
    ? notes 
    : notes.filter(n => n.category === selectedCategory);

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setIsSubmitting(true);

    try {
      const newNote = {
        text: newNoteText,
        category: newNoteCategory,
        color: newNoteColor,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }), // Format: 14 Şubat
        rotation: Math.random() * 6 - 3, // Random rotation between -3 and 3
      };

      // Add to Firebase (UI updates automatically via subscription)
      await noteService.addNote(newNote);
      
      setNewNoteText('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Firebase Hatası:", error);
      alert("Not eklenirken bir hata oluştu. Lütfen konsolu kontrol edin (Firebase Rules izinleri kapalı olabilir).");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
       {/* Header Section */}
       <div className="mb-2 px-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Pano</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Aklından geçenleri buraya yapıştır.</p>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide px-1 z-10 relative">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm border ${
              selectedCategory === cat 
                ? 'bg-rose-500 text-white border-rose-500 shadow-rose-200 dark:shadow-none' 
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notes Grid (Masonry-ish look) */}
      <div className="flex-1 overflow-y-auto px-1 pt-6 pb-32 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500">
            <Loader2 className="animate-spin mb-2 text-rose-400" size={32} />
            <p className="text-xs">Notlar yükleniyor...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500">
            <p>Bu kategoride henüz not yok.</p>
            <p className="text-xs">İlk notu sen ekle!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 auto-rows-max">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`${note.color} p-4 rounded-xl shadow-md transition-transform hover:scale-105 hover:z-10`}
                style={{ transform: `rotate(${note.rotation}deg)` }}
              >
                <div className="flex justify-between items-start mb-2 opacity-50">
                   {/* Pin graphic effect */}
                   <div className="w-3 h-3 rounded-full bg-black/10 mx-auto -mt-6 mb-2 backdrop-blur-sm"></div>
                </div>
                
                <p className="font-hand text-xl font-semibold text-slate-800 leading-snug break-words">
                  {note.text}
                </p>
                
                <div className="mt-4 flex justify-between items-end border-t border-black/5 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600/70">{note.category}</span>
                  <span className="text-[10px] text-slate-500">{note.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-rose-600 dark:bg-rose-700 rounded-full shadow-xl shadow-rose-300 dark:shadow-rose-900/40 flex items-center justify-center text-white hover:bg-rose-700 dark:hover:bg-rose-600 active:scale-90 transition-all z-40"
      >
        <Plus size={32} />
      </button>

      {/* Add Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          
          {/* Backdrop - Handles the blur and click-to-close */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          ></div>
          
          {/* Modal Content - Pure white, solid */}
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh] overflow-y-auto transition-colors duration-500">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Yeni Not Ekle</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isSubmitting}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Note Preview / Input */}
            <div className={`${newNoteColor} p-6 rounded-xl shadow-inner mb-6 transition-colors duration-200`}>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Buraya bir şeyler yaz..."
                rows={4}
                className="w-full bg-transparent border-none outline-none font-hand text-2xl text-slate-800 placeholder:text-slate-800/40 resize-none"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            {/* Controls */}
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 block">Renk Seç</label>
                <div className="flex space-x-3">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setNewNoteColor(c.class)}
                      disabled={isSubmitting}
                      className={`w-10 h-10 rounded-full border-2 transition-transform active:scale-95 ${c.class} ${
                        newNoteColor === c.class 
                          ? 'border-slate-500 ring-2 ring-slate-200 dark:ring-slate-700 scale-110' 
                          : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 block">Kategori</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c !== 'Hepsi').map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewNoteCategory(cat)}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        newNoteCategory === cat 
                          ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform flex items-center justify-center ${
                  !newNoteText.trim() || isSubmitting
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none' 
                    : 'bg-rose-600 dark:bg-rose-700 text-white shadow-rose-200 dark:shadow-rose-900/20 hover:bg-rose-700 dark:hover:bg-rose-600 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Panoya As'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterView;