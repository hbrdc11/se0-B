import { ListItem } from '../types';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

const COLLECTION_NAME = 'lists';

export const listService = {
  /**
   * Subscribes to list items based on type (plan or wish).
   * Note: Sorting is done client-side to avoid composite index requirements in Firestore.
   */
  subscribeToList: (type: 'plan' | 'wish', callback: (items: ListItem[]) => void) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('type', '==', type)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: ListItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            text: data.text,
            isCompleted: data.isCompleted,
            date: data.date,
            createdAt: data.createdAt,
            type: data.type
          });
        });
        
        // Client-side sorting: Newest first
        items.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        callback(items);
      }, (error) => {
        console.error(`Error listening to ${type} list:`, error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up subscription:", error);
      return () => {};
    }
  },

  addItem: async (item: Omit<ListItem, 'id'>) => {
    try {
      // Firestore does not accept 'undefined' values. We must sanitize the object.
      // If date is undefined (e.g. for wishes), do not include the key in the payload.
      const payload: any = {
        text: item.text,
        isCompleted: item.isCompleted,
        type: item.type,
        createdAt: new Date().toISOString()
      };

      if (item.date) {
        payload.date = item.date;
      }

      await addDoc(collection(db, COLLECTION_NAME), payload);
      return true;
    } catch (error) {
      console.error("Error adding item:", error);
      throw error;
    }
  },

  toggleComplete: async (id: string, currentStatus: boolean) => {
    try {
      const ref = doc(db, COLLECTION_NAME, id);
      await updateDoc(ref, {
        isCompleted: !currentStatus
      });
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  },

  deleteItem: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }
};