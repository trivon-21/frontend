import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardSearchService {
  private readonly headerSearchSubject = new BehaviorSubject<string>('');
  readonly headerSearch$ = this.headerSearchSubject.asObservable();

  /**
   * Updates the shared header search value.
   */
  setHeaderSearch(value: string): void {
    this.headerSearchSubject.next(value);
  }
}
