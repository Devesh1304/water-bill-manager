export interface Flat {
  id: string;
  flatNumber: string;
  residentName: string;
  whatsappNumber: string;
  currentReading: number;
  multiplier: number;
  offset: number;
}

export interface BillingRecord {
  id: string;
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
  timestamp: number;
}

export type Direction = 'credit' | 'debit';
export type DateFilter = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}

export interface DefaultSettings {
  multiplier: number;
  offset: number;
}

export interface Transaction {
  id: string;
  userId: string;
  direction: Direction;
  date: string;
  amount: number;
  flatId: string;
  flatNumber: string;
  residentName: string;
  remarks: string;
  createdAt: number;
}
