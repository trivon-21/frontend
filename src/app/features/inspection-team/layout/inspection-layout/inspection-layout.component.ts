import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { InspectionSidebarComponent } from '../../components/inspection-sidebar/inspection-sidebar.component';

@Component({
  selector: 'app-inspection-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, InspectionSidebarComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './inspection-layout.component.html'
})
export class InspectionLayoutComponent { }
