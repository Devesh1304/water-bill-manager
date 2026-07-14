import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { listenToFlats, listenToBillingHistory, listenToTransactions } from '../firebase/firestore';
import { Flat, BillingRecord, Transaction } from '../types';

interface DataContextType {
  flats: Flat[];
  billingHistory: BillingRecord[];
  transactions: Transaction[];
}

const DataContext = createContext<DataContextType>({
  flats: [],
  billingHistory: [],
  transactions: [],
});
export const useData = () => useContext(DataContext);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flats, setFlats] = useState<Flat[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) {
      setFlats([]);
      setBillingHistory([]);
      setTransactions([]);
      return;
    }
    const unsubFlats = listenToFlats(user.uid, setFlats);
    const unsubBilling = listenToBillingHistory(user.uid, setBillingHistory);
    const unsubTxns = listenToTransactions(user.uid, setTransactions);
    return () => {
      unsubFlats();
      unsubBilling();
      unsubTxns();
    };
  }, [user]);

  return (
    <DataContext.Provider value={{ flats, billingHistory, transactions }}>
      {children}
    </DataContext.Provider>
  );
}
