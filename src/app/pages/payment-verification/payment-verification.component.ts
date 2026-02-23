import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Payment } from '../../shared/models/payment.model';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-verification',
  templateUrl: './payment-verification.component.html',
  styleUrl: './payment-verification.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PaymentVerificationComponent implements OnInit {
  payments: Payment[] = [];
  searchQuery: string = '';
  showRejectModal: boolean = false;
  selectedPayment: Payment | null = null;
  rejectionReason: string = '';
  isLoading: boolean = false;
  connectionError: string = '';

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.connectionError = '';
    
    this.paymentService.getPendingPayments().subscribe({
      next: (data) => {
        console.log('✅ Loaded payments:', data.length);
        this.payments = data.map(p => ({
          ...p,
          customerName: p.customerName || p.customerEmail?.split('@')[0] || 'Unknown Customer',
          amount: p.amount || 0,
          status: (p.status as 'PENDING' | 'APPROVED' | 'REJECTED') || 'PENDING'
        }));
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Load payments error:', error);
        this.connectionError = error.message || 'Unknown error';
        this.isLoading = false;
        
        let msg = 'Cannot load payments.';
        if (error.message?.includes('Cannot connect')) {
          msg = '❌ Cannot connect to backend\n\nIs the server running on port 3000?\n\nTry: node backend/server.js';
        }
        alert(msg);
      }
    });
  }

  onSearch(): void {
    console.log('Search:', this.searchQuery);
  }

  viewSlip(payment: Payment): void {
    if (payment.slipUrl) {
      window.open(payment.slipUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('No slip available for this order.');
    }
  }

  approvePayment(payment: Payment): void {
    console.log('🎯 Approving payment:', payment._id);

    if (!payment._id) {
      console.error('❌ Missing payment._id');
      alert('Cannot approve: Payment ID is missing');
      return;
    }

    if (!confirm(`Approve payment for Order #${payment.orderId}?`)) {
      return;
    }

    this.isLoading = true;
    
    this.paymentService.approvePayment(payment._id).subscribe({
      next: (response) => {
        console.log('✅ Approval successful:', response);
        alert('✅ Payment approved successfully!');
        this.loadPayments();
      },
      error: (error: any) => {
        console.error('❌ Approval failed:', error);
        this.isLoading = false;
        
        let msg = 'Failed to approve payment.';
        if (error.message?.includes('Cannot connect')) {
          msg = '❌ Cannot connect to backend\n\nIs server running on port 3000?';
        } else if (error.status === 404) {
          msg = 'Payment not found (may be already processed).';
        } else if (error.status === 500) {
          msg = 'Server error. Check backend console.';
        }
        alert(`❌ ${msg}`);
      }
    });
  }

  openRejectModal(payment: Payment): void {
    this.selectedPayment = payment;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedPayment = null;
    this.rejectionReason = '';
  }

  rejectPayment(): void {
    const reason = this.rejectionReason.trim();
    
    if (!reason) {
      alert('⚠️ Please enter a rejection reason.');
      return;
    }

    if (!this.selectedPayment?._id) {
      console.error('❌ Missing payment._id');
      alert('Cannot reject: Payment ID is missing');
      return;
    }

    this.isLoading = true;
    
    this.paymentService.rejectPayment(this.selectedPayment._id, reason).subscribe({
      next: (response) => {
        console.log('✅ Rejection successful:', response);
        alert('✅ Payment rejected and email sent!');
        this.closeRejectModal();
        this.loadPayments();
      },
      error: (error: any) => {
        console.error('❌ Rejection failed:', error);
        this.isLoading = false;
        
        let msg = 'Failed to reject payment.';
        if (error.message?.includes('Cannot connect')) {
          msg = '❌ Cannot connect to backend\n\nIs server running on port 3000?';
        } else if (error.status === 404) {
          msg = 'Payment not found.';
        } else if (error.status === 500) {
          msg = 'Server error. Check backend console.';
        }
        alert(`❌ ${msg}`);
      }
    });
  }

  // Debug Test backend connection manually
  testConnection(): void {
    this.connectionError = 'Testing...';
    
    fetch('http://127.0.0.1:3000/api/health')
      .then(res => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('✅ Backend connected:', data);
        this.connectionError = '';
        alert('✅ Backend is reachable!\n\n' + JSON.stringify(data, null, 2));
        this.loadPayments();
      })
      .catch(err => {
        console.error('❌ Connection failed:', err);
        this.connectionError = err.message;
        alert('❌ Cannot reach backend\n\n' + err.message + '\n\nCheck:\n1. Backend running: node backend/server.js\n2. MongoDB running\n3. Port 3000 not blocked');
      });
  }

  get filteredPayments(): Payment[] {
    if (!this.searchQuery.trim()) return this.payments;
    const query = this.searchQuery.toLowerCase();
    return this.payments.filter(p => 
      p.orderId.toLowerCase().includes(query) ||
      p.customerName?.toLowerCase().includes(query) ||
      p.customerEmail?.toLowerCase().includes(query)
    );
  }
}