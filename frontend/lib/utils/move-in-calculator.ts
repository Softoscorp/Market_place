import { RentPaymentFrequency } from '../types';

export interface MoveInCosts {
  firstRentPayment: number;
  depositAmount: number;
  commissionAmount: number;
  totalMoveInCost: number;
  monthlyOngoing: number;
}

export function calculateMoveInCosts(
  monthlyRent: number,
  depositMonths: number,
  commissionMonths: number,
  paymentFrequency: RentPaymentFrequency,
  monthlyDues: number
): MoveInCosts {
  const rentMultiplier = {
    'Monthly': 1,
    '3 Months': 3,
    '6 Months': 6,
    'Yearly': 12
  }[paymentFrequency];

  const firstRentPayment = monthlyRent * rentMultiplier;
  const depositAmount = monthlyRent * depositMonths;
  const commissionAmount = monthlyRent * commissionMonths;
  
  const totalMoveInCost = firstRentPayment + depositAmount + commissionAmount;
  const monthlyOngoing = monthlyRent + monthlyDues;

  return {
    firstRentPayment,
    depositAmount,
    commissionAmount,
    totalMoveInCost,
    monthlyOngoing
  };
}
