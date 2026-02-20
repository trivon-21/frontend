import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-header',
    imports: [FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
    standalone: true        
})
export class HeaderComponent {
  searchQuery: string = '';

  onSearch() {
    console.log('Searching for:', this.searchQuery);
  }
}