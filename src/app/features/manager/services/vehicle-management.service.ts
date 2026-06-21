import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  status: 'Available' | 'In Use' | 'Maintenance';
  location: string;
  assignedTechnician?: string;
}

export interface DispatchJob {
  id: string;
  ticketId: string;
  customerName: string;
  address: string;
  priority: 'High' | 'Medium' | 'Low';
  scheduledTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleManagementService {
  getVehicles(): Observable<Vehicle[]> {
    return of([
      { id: 'V-01', name: 'Ford Transit 250', licensePlate: 'ABC-1234', status: 'Available', location: 'HQ Depot' },
      { id: 'V-02', name: 'Mercedes Sprinter', licensePlate: 'XYZ-9876', status: 'In Use', location: 'Downtown', assignedTechnician: 'Tech A' },
      { id: 'V-03', name: 'Chevy Express', licensePlate: 'LMN-4567', status: 'Maintenance', location: 'Repair Shop' },
      { id: 'V-04', name: 'Ford Transit 150', licensePlate: 'DEF-5555', status: 'Available', location: 'HQ Depot' },
    ]);
  }

  getPendingJobs(): Observable<DispatchJob[]> {
    return of([
      { id: 'J-101', ticketId: 'T-8821', customerName: 'Alice Smith', address: '123 Main St', priority: 'High', scheduledTime: 'Today 2:00 PM' },
      { id: 'J-102', ticketId: 'T-8825', customerName: 'Bob Johnson', address: '456 Oak Ave', priority: 'Medium', scheduledTime: 'Today 4:00 PM' },
      { id: 'J-103', ticketId: 'T-8830', customerName: 'Charlie Davis', address: '789 Pine Ln', priority: 'Low', scheduledTime: 'Tomorrow 9:00 AM' }
    ]);
  }
}
