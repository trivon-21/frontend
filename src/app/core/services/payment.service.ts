import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string;
  currency: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getBankDetails(): Observable<{ success: boolean, data: BankDetails }> {
    return this.http.get<{ success: boolean, data: BankDetails }>(`${this.apiUrl}/checkout/bank-details`);
  }

  updateBankSettings(details: BankDetails): Observable<{ success: boolean, message: string }> {
    const token = localStorage.getItem('token'); 
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.put<{ success: boolean, message: string }>(
      `${this.apiUrl}/admin/payment-settings`, 
      details, 
      { headers }
    );
  }
}
