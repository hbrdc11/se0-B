import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, X, Check, Trash2, Plus, Loader2 } from 'lucide-react';
import { ListItem } from '../types';
import { listService } from '../services/listService';

const HomeView: React.FC = () => {
  const [daysTogether, setDaysTogether] = useState(0);
  
  // --- MODAL STATE ---
  const [activeModal, setActiveModal] = useState<'none' | 'plan' | 'wish'>('none');
  const [items, setItems] = useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- FORM STATE ---
  const [newItemText, setNewItemText] = useState('');
  const [newItemDate, setNewItemDate] = useState('');

  useEffect(() => {
    // Relationship start date: September 30, 2023
    const startDate = new Date('2023-09-30').getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    setDaysTogether(diff);
  }, []);

  // Subscribe to data when modal opens
  useEffect(() => {
    if (activeModal === 'none') return;

    setIsLoading(true);
    const unsubscribe = listService.subscribeToList(activeModal, (fetchedItems) => {
      setItems(fetchedItems);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeModal]);

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    await listService.addItem({
      text: newItemText,
      isCompleted: false,
      type: activeModal === 'plan' ? 'plan' : 'wish',
      date: newItemDate || undefined, // undefined is handled/removed in listService
      createdAt: new Date().toISOString()
    });

    setNewItemText('');
    setNewItemDate('');
  };

  const closeModal = () => {
    setActiveModal('none');
    setItems([]);
    setNewItemText('');
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in relative">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 dark:from-rose-600 dark:to-pink-700 shadow-xl shadow-rose-200 dark:shadow-rose-900/30 p-6 text-white transition-colors duration-500">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-rose-900/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <p className="text-rose-100 text-sm font-medium mb-1">Selam Sevgilim,</p>
          <h2 className="text-3xl font-serif font-bold mb-4">İyi ki Varsın</h2>
          
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg p-3 inline-flex">
            <Clock size={16} className="text-white" />
            <span className="font-semibold">{daysTogether} Gündür Birlikteyiz</span>
          </div>
        </div>
      </div>

      {/* Daily Quote Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-500">
        <div className="flex items-center space-x-2 mb-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Hatırlıyor musun?</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300 italic font-serif leading-relaxed">
          "{daysTogether} gün önce sana ve kendime bir söz verdiğimi söylemiştim, o sözü hala gerçekleştirebiliyor olmak ve aşık olduğum kadınla ömrümü geçirecek olmak yaşadığım en güzel his"
        </p>
      </div>

      {/* Featured Shortcut Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setActiveModal('plan')}
          className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors active:scale-95"
        >
          <div className="w-10 h-10 bg-rose-200 dark:bg-rose-800/50 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-300">
            <Calendar size={20} />
          </div>
          <span className="text-sm font-medium text-rose-900 dark:text-rose-100">Planlarımız</span>
        </button>
         <button 
          onClick={() => setActiveModal('wish')}
          className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors active:scale-95"
        >
          <div className="w-10 h-10 bg-indigo-200 dark:bg-indigo-800/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">
            <Star size={20} />
          </div>
          <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Dilek Listesi</span>
        </button>
      </div>

      {/* --- MODAL (PLANS & WISHES) --- */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
             onClick={closeModal}
           ></div>

           {/* Modal Content */}
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl animate-fade-in-up flex flex-col max-h-[85vh] transition-colors duration-500">
              
              {/* Header */}
              <div className={`p-5 border-b flex justify-between items-center rounded-t-3xl transition-colors duration-500 ${
                  activeModal === 'plan' 
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' 
                    : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30'
              }`}>
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                        activeModal === 'plan' 
                            ? 'bg-rose-200 dark:bg-rose-800 text-rose-600 dark:text-rose-200' 
                            : 'bg-indigo-200 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200'
                    }`}>
                        {activeModal === 'plan' ? <Calendar size={20} /> : <Star size={20} />}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${
                            activeModal === 'plan' 
                                ? 'text-rose-900 dark:text-rose-100' 
                                : 'text-indigo-900 dark:text-indigo-100'
                        }`}>
                            {activeModal === 'plan' ? 'Gelecek Planlarımız' : 'Dilek Listemiz'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {activeModal === 'plan' ? 'Birlikte yapacaklarımız' : 'Hayallerimiz...'}
                        </p>
                    </div>
                 </div>
                 <button onClick={closeModal} className="p-2 bg-white/50 dark:bg-slate-800/50 rounded-full text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              {/* List Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                 {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-10">
                        <Loader2 className="animate-spin mb-2" />
                        <span className="text-xs">Yükleniyor...</span>
                    </div>
                 ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 py-10 opacity-60">
                        {activeModal === 'plan' ? <Calendar size={40} className="mb-2" /> : <Star size={40} className="mb-2" />}
                        <span className="text-sm font-medium">Listeniz boş</span>
                        <span className="text-xs">Hadi ilkini ekleyelim!</span>
                    </div>
                 ) : (
                    items.map((item) => (
                        <div 
                           key={item.id} 
                           className={`group flex items-center p-3 rounded-xl border transition-all ${
                               item.isCompleted 
                                 ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-60' 
                                 : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:border-rose-200 dark:hover:border-rose-800'
                           }`}
                        >
                           {/* Checkbox */}
                           <button 
                             onClick={() => listService.toggleComplete(item.id, item.isCompleted)}
                             className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors flex-shrink-0 ${
                                 item.isCompleted 
                                   ? 'bg-green-500 border-green-500 text-white' 
                                   : 'border-slate-300 dark:border-slate-500 text-transparent hover:border-green-400 dark:hover:border-green-400'
                             }`}
                           >
                              <Check size={14} strokeWidth={3} />
                           </button>

                           {/* Content */}
                           <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                  item.isCompleted 
                                    ? 'line-through text-slate-400 dark:text-slate-500' 
                                    : 'text-slate-800 dark:text-slate-200'
                              }`}>
                                  {item.text}
                              </p>
                              {item.date && (
                                  <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold mt-0.5 flex items-center gap-1">
                                      <Calendar size={10} /> {new Date(item.date).toLocaleDateString('tr-TR')}
                                  </p>
                              )}
                           </div>

                           {/* Delete */}
                           <button 
                             onClick={() => listService.deleteItem(item.id)}
                             className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                    ))
                 )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl border-t border-slate-100 dark:border-slate-800 transition-colors duration-500">
                  <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            placeholder={activeModal === 'plan' ? 'Yeni bir plan...' : 'Bir dilek tut...'}
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-rose-400 dark:focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900/30 transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        />
                        <button 
                            onClick={handleAddItem}
                            disabled={!newItemText.trim()}
                            className="bg-rose-600 text-white p-3 rounded-xl shadow-lg shadow-rose-200 dark:shadow-rose-900/20 hover:bg-rose-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                        >
                            <Plus size={24} />
                        </button>
                      </div>
                      
                      {/* Date Picker (Only for Plans) */}
                      {activeModal === 'plan' && (
                          <input 
                            type="date" 
                            value={newItemDate}
                            onChange={(e) => setNewItemDate(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500 dark:text-slate-400 outline-none focus:border-rose-300 dark:focus:border-rose-600"
                          />
                      )}
                  </div>
              </div>

           </div>
        </div>
      )}

    </div>
  );
};

export default HomeView;