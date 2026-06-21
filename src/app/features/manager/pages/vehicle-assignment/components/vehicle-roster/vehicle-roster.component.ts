import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Vehicle } from '../../../../services/vehicle-management.service';
@Component({ selector: 'app-vehicle-roster', standalone: true, imports: [CommonModule, LucideAngularModule], templateUrl: './vehicle-roster.component.html', styleUrls: ['./vehicle-roster.component.css'] })
export class VehicleRosterComponent {
  @Input() vehicles: Vehicle[] = [];
}