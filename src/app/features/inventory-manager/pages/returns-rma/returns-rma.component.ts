import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RmaLog {
  serial: string;
  user: string;
  fault: string;
  date: string;
  status: 'Single' | 'Bundle';
}

interface QuarantineItem {
  name: string;
  qty: string;
  reason: string;
  dateAdded: string;
  location: string;
}

@Component({
  selector: 'app-returns-rma-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returns-rma.component.html',
  styleUrls: ['./returns-rma.component.css']
})
export class ReturnsRmaDashboardComponent {
  rmaLogs: RmaLog[] = [
    { serial: 'CAR-IND-2024-2234', user: 'Pradeep Silva', fault: 'Fan motor defective, not rotating', date: '2025-02-14', status: 'Single' },
    { serial: 'CAR-IND-2024-2234', user: 'Pradeep Silva', fault: 'Fan motor defective, not rotating', date: '2025-02-12', status: 'Bundle' },
    { serial: 'CAR-IND-2024-2234', user: 'Pradeep Silva', fault: 'Fan motor defective, not rotating', date: '2025-02-10', status: 'Single' },
    { serial: 'CAR-IND-2024-2234', user: 'Pradeep Silva', fault: 'Fan motor defective, not rotating', date: '2025-02-05', status: 'Bundle' }
  ];

  quarantineItems: QuarantineItem[] = [
    { name: 'Copper Pipe 1/4" (Dented)', qty: '15 units', reason: 'Physical damage during transport', dateAdded: '2025-02-10', location: 'Zone C - Shelf 4' },
    { name: 'Installation Kit - Standard (Incomplete)', qty: '3 units', reason: 'Missing components, cannot be sold as complete kit', dateAdded: '2025-02-08', location: 'Zone C - Shelf 2' },
    { name: 'Wall Mounting Brackets (Rusted)', qty: '8 units', reason: 'Water damage, surface rust detected', dateAdded: '2025-02-12', location: 'Zone C - Shelf 1' }
  ];

  disposeItem(index: number) {
    this.quarantineItems.splice(index, 1);
  }
}
