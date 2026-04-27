import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeProvider } from './core/styling';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(private themeProvider: ThemeProvider) {}

  ngOnInit() {
    this.themeProvider.loadTheme();
  }
}
