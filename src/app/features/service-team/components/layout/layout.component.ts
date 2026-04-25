import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, HeaderComponent, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'})
export class LayoutComponent {}
