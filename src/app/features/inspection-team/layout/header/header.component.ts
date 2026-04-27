import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InspectionOfficerService } from '../../services/inspection-officer.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  searchQuery: string = '';
  pendingCount: number = 0;

  showSettings = false;
  showNotifications = false;

  constructor(private inspectionOfficerService: InspectionOfficerService) { }

  ngOnInit(): void {
    this.loadScheduledInspections();
  }

  loadScheduledInspections() {
    this.inspectionOfficerService.getScheduledInspections().subscribe({
      next: (data) => {
        this.pendingCount = data.length;
      },
      error: (err) => console.error(err)
    });
  }

  onSearch() {
    console.log('Searching for:', this.searchQuery);
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
    this.showNotifications = false;
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showSettings = false;
  }

  logout() {
    alert('Logged out (Demo)');
  }

  manageProfile() {
    alert('Manage Profile clicked (Demo)');
  }
}
