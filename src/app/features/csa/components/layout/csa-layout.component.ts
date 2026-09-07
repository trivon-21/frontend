import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CsaSidebarComponent } from '../sidebar/csa-sidebar.component';
import { CsaHeaderComponent } from '../header/csa-header.component';

@Component({
  selector: 'app-csa-layout',
  standalone: true,
  imports: [RouterOutlet, CsaSidebarComponent, CsaHeaderComponent],
  template: `
    <div class="csa-layout">
      <app-csa-sidebar></app-csa-sidebar>
      <div class="csa-main">
        <app-csa-header></app-csa-header>
        <main class="csa-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .csa-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: #f3f4f2;
    }
    .csa-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }
    .csa-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px 40px;
    }
  `]
})
export class CsaLayoutComponent {}
