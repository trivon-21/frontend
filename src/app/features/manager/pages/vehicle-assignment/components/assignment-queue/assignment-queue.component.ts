import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DispatchJob } from '../../../../services/vehicle-management.service';
@Component({ selector: 'app-assignment-queue', standalone: true, imports: [CommonModule, LucideAngularModule], templateUrl: './assignment-queue.component.html', styleUrls: ['./assignment-queue.component.css'] })
export class AssignmentQueueComponent {
  @Input() jobs: DispatchJob[] = [];
}