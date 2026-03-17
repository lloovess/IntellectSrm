import { PaymentItem, NewPaymentItem } from "@/lib/db/schema/payment-items";
import { PaymentTransaction, NewPaymentTransaction } from "@/lib/db/schema/payment-transactions";

export type { PaymentItem, NewPaymentItem, PaymentTransaction, NewPaymentTransaction };

export type PaymentStatus = 'planned' | 'partially_paid' | 'paid' | 'overdue';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'kaspi';
