import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { listenToFlats, listenToBillingHistory } from '../firebase/firestore';
import { Flat, BillingRecord } from '../types';

interface DataContextType {
  flats: Flat[];
  billingHistory: BillingRecord[];
}

const DataContext = createContext<DataContextType>({
  flats: [],
  billingHistory: [],
});
export const useData = () => useContext(DataContext);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flats, setFlats] = useState<Flat[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);

  useEffect(() => {
    if (!user) {
      setFlats([]);
      setBillingHistory([]);
      return;
    }
    const unsubFlats = listenToFlats(user.uid, setFlats);
    const unsubBilling = listenToBillingHistory(user.uid, setBillingHistory);
    return () => {
      unsubFlats();
      unsubBilling();
    };
  }, [user]);

  return (
    <DataContext.Provider value={{ flats, billingHistory }}>
      {children}
    </DataContext.Provider>
  );
}
