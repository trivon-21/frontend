import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CsaInquiryService, CustomerInquiry } from '../../services/csa-inquiry.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-csa-inquiries',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './csa-inquiries.component.html',
  styleUrl: './csa-inquiries.component.css'
})
export class CsaInquiriesComponent implements OnInit {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;

  inquiries: CustomerInquiry[] = [];
  selectedInquiry: CustomerInquiry | null = null;
  totalInquiries = 0;

  // KPI Stats
  countTotal = 0;
  countAwaiting = 0;
  countOngoing = 0;
  countClosed = 0;

  // Filters
  selectedStatus = 'ALL';
  searchQuery = '';

  isLoading = false;
  errorMessage = '';
  successToast = '';

  // Reply
  replyText = '';
  isSendingReply = false;
  replyError = '';

  constructor(private inquiryService: CsaInquiryService) {}

  ngOnInit(): void {
    this.loadInquiries();
  }

  loadInquiries(keepSelected = true): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.inquiryService.getInquiries({
      search: this.searchQuery,
      status: this.selectedStatus
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.inquiries = res.inquiries || [];
          this.totalInquiries = res.total || this.inquiries.length;
          this.calculateStats();

          if (this.inquiries.length > 0) {
            if (keepSelected && this.selectedInquiry) {
              const matched = this.inquiries.find(i => i._id === this.selectedInquiry!._id);
              this.selectedInquiry = matched || this.inquiries[0];
            } else {
              this.selectedInquiry = this.inquiries[0];
            }
            this.scrollToBottom();
          } else {
            this.selectedInquiry = null;
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load inquiries:', err);
        this.errorMessage = 'Failed to load customer inquiries. Please try again.';
      }
    });
  }

  calculateStats(): void {
    this.countTotal = this.totalInquiries;
    this.countAwaiting = this.inquiries.filter(i => i.status === 'Awaiting').length;
    this.countOngoing = this.inquiries.filter(i => i.status === 'Ongoing' || i.status === 'Addressed').length;
    this.countClosed = this.inquiries.filter(i => i.status === 'Closed').length;
  }

  selectInquiry(inquiry: CustomerInquiry): void {
    this.selectedInquiry = inquiry;
    this.replyText = '';
    this.replyError = '';
    this.scrollToBottom();
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.loadInquiries(false);
  }

  applySearch(): void {
    this.loadInquiries(false);
  }

  sendReply(): void {
    if (!this.selectedInquiry || !this.replyText.trim()) return;
    if (this.selectedInquiry.status === 'Closed') {
      this.replyError = 'This inquiry is closed. Please reopen it to send a reply.';
      return;
    }

    this.isSendingReply = true;
    this.replyError = '';

    const replyMsg = this.replyText.trim();
    this.inquiryService.replyToInquiry(this.selectedInquiry._id, {
      message: replyMsg
    }).subscribe({
      next: (res) => {
        this.isSendingReply = false;
        this.replyText = '';
        this.showToast('Reply sent and inquiry marked as Ongoing!');

        if (res && res.inquiry) {
          this.selectedInquiry = res.inquiry;
          const idx = this.inquiries.findIndex(i => i._id === res.inquiry._id);
          if (idx !== -1) {
            this.inquiries[idx] = res.inquiry;
          }
        }
        this.calculateStats();
        this.scrollToBottom();
      },
      error: (err) => {
        this.isSendingReply = false;
        console.error('Failed to send reply:', err);
        this.replyError = err.error?.message || err.message || 'Failed to send reply.';
      }
    });
  }

  closeInquiry(): void {
    if (!this.selectedInquiry) return;

    this.inquiryService.updateInquiryStatus(this.selectedInquiry._id, 'Closed').subscribe({
      next: (res) => {
        this.replyText = '';
        this.replyError = '';
        this.showToast('Inquiry resolved and marked as Closed');
        if (res && res.inquiry) {
          this.selectedInquiry = res.inquiry;
          const idx = this.inquiries.findIndex(i => i._id === res.inquiry._id);
          if (idx !== -1) {
            this.inquiries[idx] = res.inquiry;
          }
        }
        this.calculateStats();
      },
      error: (err) => {
        console.error('Failed to close inquiry:', err);
        alert('Failed to close inquiry: ' + (err.error?.message || err.message));
      }
    });
  }

  reopenInquiry(): void {
    if (!this.selectedInquiry) return;

    this.inquiryService.updateInquiryStatus(this.selectedInquiry._id, 'Ongoing').subscribe({
      next: (res) => {
        this.showToast('Inquiry reopened and marked as Ongoing');
        if (res && res.inquiry) {
          this.selectedInquiry = res.inquiry;
          const idx = this.inquiries.findIndex(i => i._id === res.inquiry._id);
          if (idx !== -1) {
            this.inquiries[idx] = res.inquiry;
          }
        }
        this.calculateStats();
      },
      error: (err) => {
        console.error('Failed to reopen inquiry:', err);
        alert('Failed to reopen inquiry: ' + (err.error?.message || err.message));
      }
    });
  }

  changeStatus(status: string): void {
    if (!this.selectedInquiry) return;

    this.inquiryService.updateInquiryStatus(this.selectedInquiry._id, status).subscribe({
      next: (res) => {
        this.showToast(`Inquiry marked as ${status}`);
        if (res && res.inquiry) {
          this.selectedInquiry = res.inquiry;
          const idx = this.inquiries.findIndex(i => i._id === res.inquiry._id);
          if (idx !== -1) {
            this.inquiries[idx] = res.inquiry;
          }
        }
        this.calculateStats();
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        alert('Failed to update status: ' + (err.error?.message || err.message));
      }
    });
  }

  showToast(msg: string): void {
    this.successToast = msg;
    setTimeout(() => {
      if (this.successToast === msg) {
        this.successToast = '';
      }
    }, 4000);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.chatMessagesContainer) {
          this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
        }
      } catch (err) {}
    }, 100);
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
}
