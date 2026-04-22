import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ActiveLoan {
  id: string;
  toolName: string;
  assetTag: string;
  heldBy: string;
  checkedOut: string;
  dueDate: string;
  status: 'On Time' | 'Overdue';
}

@Component({
  selector: 'app-asset-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-management.component.html',
  styleUrls: ['./asset-management.component.css']
})
export class AssetManagementDashboardComponent {
  showModal = false;
  
  loans: ActiveLoan[] = [
    { id: '1', toolName: 'Vacuum Pump (Professional)', assetTag: 'VCP-004', heldBy: 'Sunil Bandara', checkedOut: '2025-02-15 09:30 AM', dueDate: '2025-02-18', status: 'On Time' },
    { id: '2', toolName: 'Cordless Drill Kit (Makita 18V)', assetTag: 'DRL-012', heldBy: 'Kamal Wijesinghe', checkedOut: '2025-02-14 02:15 PM', dueDate: '2025-02-17', status: 'On Time' },
    { id: '3', toolName: 'Refrigerant Recovery Machine', assetTag: 'RRM-008', heldBy: 'Nimal Fernando', checkedOut: '2025-02-12 11:00 AM', dueDate: '2025-02-16', status: 'Overdue' },
    { id: '4', toolName: 'Digital Manifold Gauge Set', assetTag: 'MGS-015', heldBy: 'Pradeep Silva', checkedOut: '2025-02-16 08:45 AM', dueDate: '2025-02-19', status: 'On Time' },
    { id: '5', toolName: 'Pipe Bender Kit', assetTag: 'PBK-003', heldBy: 'Ranjith Perera', checkedOut: '2025-02-13 01:30 PM', dueDate: '2025-02-16', status: 'Overdue' },
    { id: '6', toolName: 'Leak Detector (Electronic)', assetTag: 'LKD-007', heldBy: 'Lakshmi Rajapaksa', checkedOut: '2025-02-17 10:00 AM', dueDate: '2025-02-20', status: 'On Time' },
    { id: '7', toolName: 'Torque Wrench Set', assetTag: 'TWS-021', heldBy: 'Ayesha Rashid', checkedOut: '2025-02-15 03:20 PM', dueDate: '2025-02-18', status: 'On Time' }
  ];

  openRegisterModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  markReturned(id: string) {
    this.loans = this.loans.filter(l => l.id !== id);
  }
}
