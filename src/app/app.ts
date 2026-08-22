import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeProvider } from './core/styling';
import { LocalAuthSwitcherComponent } from './core/auth/local-auth-switcher.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LocalAuthSwitcherComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  constructor(private themeProvider: ThemeProvider) {}

  ngOnInit() {
    this.themeProvider.loadTheme();
  }
}
