import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private readonly searchQuerySubject = new BehaviorSubject<string>('');

  readonly searchQuery$ = this.searchQuerySubject.asObservable();

  /** Stores the current trimmed search query for shared consumers. */
  setQuery(query: string): void {
    this.searchQuerySubject.next(query.trim());
  }

  /** Clears the shared search query state. */
  clear(): void {
    this.searchQuerySubject.next('');
  }
}
