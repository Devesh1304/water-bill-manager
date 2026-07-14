import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { listenToFlats, listenToBillingHistory, listenToTransactions, listenToDefaultSettings } from '../firebase/firestore';
import { Flat, BillingRecord, Transaction, DefaultSettings } from '../types';

interface DataContextType {
  flats: Flat[];
  billingHistory: BillingRecord[];
  transactions: Transaction[];
  defaultSettings: DefaultSettings;
}

const DataContext = createContext<DataContextType>({
  flats: [],
  billingHistory: [],
  transactions: [],
  defaultSettings: { multiplier: 0, offset: 0, minimumUnits: 0 },
});
export const useData = () => useContext(DataContext);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flats, setFlats] = useState<Flat[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [defaultSettings, setDefaultSettings] = useState<DefaultSettings>({ multiplier: 0, offset: 0, minimumUnits: 0 });

  useEffect(() => {
    if (!user) {
      setFlats([]);
      setBillingHistory([]);
      setTransactions([]);
      setDefaultSettings({ multiplier: 0, offset: 0 });
      return;
    }
    const unsubFlats = listenToFlats(user.uid, setFlats);
    const unsubBilling = listenToBillingHistory(user.uid, setBillingHistory);
    const unsubTxns = listenToTransactions(user.uid, setTransactions);
    const unsubSettings = listenToDefaultSettings(user.uid, setDefaultSettings);
    return () => {
      unsubFlats();
      unsubBilling();
      unsubTxns();
      unsubSettings();
    };
  }, [user]);

  return (
    <DataContext.Provider value={{ flats, billingHistory, transactions, defaultSettings }}>
      {children}
    </DataContext.Provider>
  );
}
