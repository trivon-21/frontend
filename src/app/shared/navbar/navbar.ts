/**
 * navbar.ts
 * Top navigation bar component — shared across all pages.
 * Displays the AirLux brand logo and navigation links.
 * This component is purely presentational (no inputs needed).
 */

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {}
