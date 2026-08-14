import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consultation-bridge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consultation-bridge.html',
  styleUrl: './consultation-bridge.css'
})
export class ConsultationBridge implements OnInit {
  private router = inject(Router);
  
  productId: string | null = null;
  productName: string = '';
  username: string = '';

  ngOnInit() {
    this.username = localStorage.getItem('username') || 'Customer';
    const state = history.state;
    if (state && state.productId) {
      this.productId = state.productId;
      this.productName = state.productName || 'the selected AC';
    }
  }

  onNowIKnow() {
    if (this.productId) {
      // Flag to indicate consultation was completed
      localStorage.setItem('consultationCompleted', 'true');
      this.router.navigate(['/product-detail'], { 
        queryParams: { id: this.productId },
        state: { autoKnow: true }
      });
    } else {
      this.router.navigate(['/']);
    }
  }

  onBackToCatalog() {
    localStorage.removeItem('consultationCompleted');
    this.router.navigate(['/']);
  }
}
