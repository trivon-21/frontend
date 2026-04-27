import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalSearchService } from '../../services/global-search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'})
export class HeaderComponent {
  searchQuery = '';

  constructor(private globalSearchService: GlobalSearchService) {}

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.globalSearchService.setQuery(this.searchQuery);
  }
}
