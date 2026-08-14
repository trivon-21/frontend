import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CartScenario {
  _id: string;
  scenarioName: string;
  items: any[];
  totalAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartScenarioService {
  private apiUrl = `${environment.apiUrl}/scenarios`;
  private http = inject(HttpClient);

  getScenarios(): Observable<{ success: boolean, data: CartScenario[] }> {
    return this.http.get<{ success: boolean, data: CartScenario[] }>(this.apiUrl);
  }

  checkoutScenario(scenarioId: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/checkout`, { scenarioId, userId });
  }
}
