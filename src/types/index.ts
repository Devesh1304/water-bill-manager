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
