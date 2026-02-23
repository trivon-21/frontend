/**
 * hero-section.ts
 * Hero banner component shown below the navbar.
 * Displays the "Premium Cooling Solutions" heading with a dark teal background.
 * This component is purely presentational — no inputs or services needed.
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  imports: [],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSectionComponent {}
