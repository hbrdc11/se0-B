import { StickyNote } from '../types';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

const COLLECTION_NAME = 'notes';

export const noteService = {
  /**
   * Subscribes to the notes collection in Firestore.
   */
  subscribeToNotes: (callback: (notes: StickyNote[]) => void) => {
    try {
      console.log("Subscribing to notes...");
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notes: StickyNote[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notes.push({
            id: doc.id,
            text: data.text,
            category: data.category,
            color: data.color,
            date: data.date,
            rotation: data.rotation,
          } as StickyNote);
        });
        console.log("Fetched notes:", notes.length);
        callback(notes);
      }, (error) => {
        console.error("Error listening to notes:", error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up subscription:", error);
      return () => {};
    }
  },

  /**
   * Adds a new note to Firestore.
   */
  addNote: async (note: Omit<StickyNote, 'id'>) => {
    try {
      console.log("Adding note to Firestore...", note);
      
      // We use ISO string for createdAt to be safe across different JS contexts
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...note,
        createdAt: new Date().toISOString() 
      });
      
      console.log("Note added with ID: ", docRef.id);
      return true;
    } catch (error) {
      console.error("Error adding note service:", error);
      throw error;
    }
  }
};