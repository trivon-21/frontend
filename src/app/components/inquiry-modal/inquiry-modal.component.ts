import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InquiryService, Inquiry, ThreadMessage } from '../../services/inquiry.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inquiry-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inquiry-modal.component.html',
  styleUrl: './inquiry-modal.component.css',
})
export class InquiryModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  activeTab: 'new' | 'list' = 'new';

  // New Inquiry form
  name = '';
  email = '';
  phone = '';
  inquiryType = 'Other';
  message = '';
  submitting = false;
  submitted = false;
  submitError: string | null = null;
  submittedInquiry: Inquiry | null = null;

  // My Inquiries
  inquiries: Inquiry[] = [];
  loadingList = false;
  listError: string | null = null;
  selectedInquiry: Inquiry | null = null;

  // Reply
  replyMessage = '';
  replying = false;
  replyError: string | null = null;

  readonly inquiryTypes = ['Product', 'Pricing', 'Installation', 'Warranty', 'AMC', 'Other'];

  constructor(private inquiryService: InquiryService, private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.name = `${user.fullName}${user.lastName ? ' ' + user.lastName : ''}`.trim();
      this.email = user.email;
      this.phone = user.phoneNumber || '';
    }
  }

  close() { this.closed.emit(); }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  setTab(tab: 'new' | 'list') {
    this.activeTab = tab;
    if (tab === 'list' && this.inquiries.length === 0) this.loadInquiries();
  }

  loadInquiries() {
    this.loadingList = true;
    this.listError = null;
    this.inquiryService.getInquiries().subscribe({
      next: (list) => { this.inquiries = list; this.loadingList = false; },
      error: (err) => { this.listError = err.error?.message || 'Failed to load inquiries.'; this.loadingList = false; }
    });
  }

  submit() {
    if (!this.message.trim()) { this.submitError = 'Message is required.'; return; }
    this.submitError = null;
    this.submitting = true;
    this.inquiryService.createInquiry({
      name: this.name,
      email: this.email,
      phone: this.phone,
      inquiryType: this.inquiryType,
      message: this.message
    }).subscribe({
      next: (res) => {
        this.submittedInquiry = res.inquiry;
        this.submitted = true;
        this.submitting = false;
      },
      error: (err) => {
        this.submitError = err.error?.message || 'Failed to submit inquiry.';
        this.submitting = false;
      }
    });
  }

  resetForm() {
    this.submitted = false;
    this.submittedInquiry = null;
    this.message = '';
    this.inquiryType = 'Other';
    this.submitError = null;
  }

  openInquiry(inq: Inquiry) {
    this.selectedInquiry = { ...inq };
    this.replyMessage = '';
    this.replyError = null;
  }

  backToList() {
    this.selectedInquiry = null;
    this.loadInquiries();
  }

  sendReply() {
    if (!this.replyMessage.trim()) return;
    this.replying = true;
    this.replyError = null;
    this.inquiryService.replyToInquiry(this.selectedInquiry!._id, this.replyMessage).subscribe({
      next: (res) => {
        this.selectedInquiry = res.inquiry;
        this.replyMessage = '';
        this.replying = false;
      },
      error: (err) => {
        this.replyError = err.error?.message || 'Failed to send reply.';
        this.replying = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Ongoing': 'badge--blue',
      'Addressed': 'badge--green',
      'Closed': 'badge--grey'
    };
    return map[status] || '';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
