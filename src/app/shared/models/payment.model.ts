
export interface Payment {
  _id: string;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  slipUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string | Date;
  approvedAt?: string | Date;
  rejectedAt?: string | Date;
}
/*export interface Payment {
  _id: string;
  orderId: string;
  customerName: string;
  amount: number;
  slipUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: Date;
}*/