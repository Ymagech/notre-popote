import { collection, addDoc, getDocs, doc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { CalendarEntry } from '@/types';

const CALENDAR_COLLECTION = 'menuCalendar';

export async function getCalendarEntries(startDateStr: string, endDateStr: string): Promise<CalendarEntry[]> {
  const q = query(
    collection(db, CALENDAR_COLLECTION),
    where('date', '>=', startDateStr),
    where('date', '<=', endDateStr)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as CalendarEntry));
}

export async function addCalendarEntry(entry: Omit<CalendarEntry, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, CALENDAR_COLLECTION), {
    ...entry,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function deleteCalendarEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, CALENDAR_COLLECTION, id));
}
