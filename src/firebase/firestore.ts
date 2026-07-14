import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Flat, BillingRecord, Transaction, Direction } from '../types';

function toMillis(value: any): number {
  if (value instanceof Timestamp) return value.toMillis();
  return value ?? 0;
}

export interface FlatInput {
  userId: string;
  flatNumber: string;
  residentName: string;
  whatsappNumber: string;
  currentReading: number;
  multiplier: number;
  offset: number;
}

export async function createFlat(input: FlatInput): Promise<void> {
  await addDoc(collection(db, 'flats'), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function updateFlat(id: string, input: Partial<FlatInput>): Promise<void> {
  await updateDoc(doc(db, 'flats', id), input);
}

export async function deleteFlat(id: string): Promise<void> {
  await deleteDoc(doc(db, 'flats', id));
}

export function listenToFlats(
  userId: string,
  callback: (flats: Flat[]) => void
): () => void {
  const q = query(collection(db, 'flats'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const flats = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Flat))
      .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true }));
    callback(flats);
  });
}

export interface BillingInput {
  userId: string;
  flatId: string;
  flatNumber: string;
  residentName: string;
  billingMonth: string;
  previousReading: number;
  newReading: number;
  unitsConsumed: number;
  adjustmentUnits: number;
  totalUnits: number;
  multiplier: number;
  offset: number;
  totalBillAmount: number;
}

export async function createBillingRecord(input: BillingInput): Promise<void> {
  await addDoc(collection(db, 'billingHistory'), {
    ...input,
    timestamp: serverTimestamp(),
  });
}

export async function deleteBillingRecord(id: string): Promise<void> {
  await deleteDoc(doc(db, 'billingHistory', id));
}

export function listenToBillingHistory(
  userId: string,
  callback: (records: BillingRecord[]) => void,
  flatId?: string
): () => void {
  let q;
  if (flatId) {
    q = query(
      collection(db, 'billingHistory'),
      where('userId', '==', userId),
      where('flatId', '==', flatId)
    );
  } else {
    q = query(
      collection(db, 'billingHistory'),
      where('userId', '==', userId)
    );
  }
  return onSnapshot(q, (snap) => {
    const records = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          timestamp: toMillis(data.timestamp),
        } as BillingRecord;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
    callback(records);
  });
}

// ---------- Transactions ----------

export interface TransactionInput {
  userId: string;
  direction: Direction;
  date: string;
  amount: number;
  flatId: string;
  flatNumber: string;
  residentName: string;
  remarks: string;
}

export async function createTransaction(input: TransactionInput): Promise<void> {
  await addDoc(collection(db, 'transactions'), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, 'transactions', id));
}

export function listenToTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
): () => void {
  const q = query(collection(db, 'transactions'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const transactions = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: toMillis(data.createdAt),
      } as Transaction;
    });
    callback(transactions);
  });
}
