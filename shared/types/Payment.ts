/**
 * Shared Types - Payment
 */

export enum PaymentStatus {
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
}

export interface ICheckoutPaymentInput {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface IPayment {
  _id?: string;
  orderId: string;
  amount: number;
  provider: string;
  cardBrand: string;
  cardLast4: string;
  status: PaymentStatus;
  transactionRef: string;
  paidAt?: Date;
  createdAt?: Date;
}
