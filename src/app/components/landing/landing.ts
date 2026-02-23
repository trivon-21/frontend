/**
 * landing.ts
 * Landing page component — the first page users see.
 * Use this component to build the home/welcome screen of the AirLux system.
 *
 * Route: configured in app.routes.ts
 */

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {}
