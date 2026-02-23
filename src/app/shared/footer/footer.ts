/**
 * footer.ts
 * Site-wide footer component.
 * Displays the AirLux brand blurb, contact info, and social links.
 * Purely presentational — no inputs or services required.
 */

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  /** Current year displayed in the copyright notice */
  readonly currentYear = signal(new Date().getFullYear());
}
