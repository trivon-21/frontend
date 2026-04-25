import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'})
export class SidebarComponent {
  constructor(private router: Router) { }

  isInspectionsRoute(): boolean {
    return (
      this.router.url.includes('/main-technician-inspections') ||
      this.router.url.includes('/main-technician-inspection-details') ||
      this.router.url.includes('/main-technician-inspection-review')
    );
  }
}
