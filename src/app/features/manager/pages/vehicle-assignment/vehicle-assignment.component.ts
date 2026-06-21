import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignmentQueueComponent } from './components/assignment-queue/assignment-queue.component';
import { VehicleRosterComponent } from './components/vehicle-roster/vehicle-roster.component';
import { MapPlaceholderComponent } from './components/map-placeholder/map-placeholder.component';
import { VehicleManagementService, Vehicle, DispatchJob } from '../../services/vehicle-management.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-vehicle-assignment',
  standalone: true,
  imports: [CommonModule, AssignmentQueueComponent, VehicleRosterComponent, MapPlaceholderComponent],
  templateUrl: './vehicle-assignment.component.html',
  styleUrls: ['./vehicle-assignment.component.css']
})
export class VehicleAssignmentComponent implements OnInit {
  vehicles$!: Observable<Vehicle[]>;
  jobs$!: Observable<DispatchJob[]>;

  constructor(private vehicleService: VehicleManagementService) {}

  ngOnInit() {
    this.vehicles$ = this.vehicleService.getVehicles();
    this.jobs$ = this.vehicleService.getPendingJobs();
  }
}