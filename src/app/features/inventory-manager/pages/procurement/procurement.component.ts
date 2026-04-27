import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RecentShipment {
  id: string;
  supplier: string;
  items: string;
  units: string;
  date: string;
  user: string;
}

@Component({
  selector: 'app-procurement-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procurement.component.html',
  styleUrls: ['./procurement.component.css']
})
export class ProcurementDashboardComponent {
  currentStep = 1;

  shipments: RecentShipment[] = [
    { id: 'INV-LG-2025-0421', supplier: 'LG Electronics Lanka', items: '8 items', units: '45 units', date: '2025-02-17 02:30 PM', user: 'Saman Jayawardena' },
    { id: 'INV-SAM-2025-1204', supplier: 'Samsung Electronics', items: '5 items', units: '30 units', date: '2025-02-16 11:15 AM', user: 'Nimal Fernando' },
    { id: 'INV-DAI-2025-0789', supplier: 'Daikin Airconditioning India', items: '12 items', units: '68 units', date: '2025-02-15 09:45 AM', user: 'Kamal Wijesinghe' },
    { id: 'INV-ABN-2025-3312', supplier: 'Abans PLC', items: '6 items', units: '25 units', date: '2025-02-14 03:20 PM', user: 'Saman Jayawardena' }
  ];

  nextStep() {
    if (this.currentStep < 3) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  setStep(step: number) {
    this.currentStep = step;
  }
}
