/**
 * app.ts
 * Root application component.
 * Its only responsibility is to host the <router-outlet />,
 * which renders the matched route component (ProductDetailComponent by default).
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App { }
