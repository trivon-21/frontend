import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MaterialRequest {
  id: string;
  requester: string;
  date: string;
  location: string;
  status: 'available' | 'missing' | 'warning';
  items: { name: string; qty: number }[];
  moreCount: number;
}

@Component({
  selector: 'app-material-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './material-requests.component.html',
  styleUrls: ['./material-requests.component.css']
})
export class MaterialRequestsDashboardComponent {
  activeTab: 'pending' | 'reserved' | 'completed' = 'pending';

  pendingRequests: MaterialRequest[] = [
    {
      id: '#402',
      requester: 'Saman Perera',
      date: '2025-02-18',
      location: 'Colombo 03',
      status: 'available',
      items: [
        { name: 'LG Inverter 12k - Outdoor Unit', qty: 1 },
        { name: 'LG Inverter 12k - Indoor Unit', qty: 1 },
        { name: 'Copper Pipe 1/4"', qty: 3 }
      ],
      moreCount: 2
    },
    {
      id: '#402',
      requester: 'Saman Perera',
      date: '2025-02-18',
      location: 'Colombo 03',
      status: 'warning',
      items: [
        { name: 'LG Inverter 12k - Outdoor Unit', qty: 1 },
        { name: 'LG Inverter 12k - Indoor Unit', qty: 1 },
        { name: 'Copper Pipe 1/4"', qty: 3 }
      ],
      moreCount: 2
    }
  ];

  reservedRequests: MaterialRequest[] = [
    {
      id: '#402',
      requester: 'Saman Perera',
      date: '2025-02-18',
      location: 'Colombo 03',
      status: 'available',
      items: [
        { name: 'LG Inverter 12k - Outdoor Unit', qty: 1 },
        { name: 'LG Inverter 12k - Indoor Unit', qty: 1 },
        { name: 'Copper Pipe 1/4"', qty: 3 }
      ],
      moreCount: 2
    },
    {
      id: '#402',
      requester: 'Saman Perera',
      date: '2025-02-18',
      location: 'Colombo 03',
      status: 'warning',
      items: [
        { name: 'LG Inverter 12k - Outdoor Unit', qty: 1 },
        { name: 'LG Inverter 12k - Indoor Unit', qty: 1 },
        { name: 'Copper Pipe 1/4"', qty: 3 }
      ],
      moreCount: 2
    },
    {
      id: '#402',
      requester: 'Saman Perera',
      date: '2025-02-18',
      location: 'Colombo 03',
      status: 'available',
      items: [
        { name: 'LG Inverter 12k - Outdoor Unit', qty: 1 },
        { name: 'LG Inverter 12k - Indoor Unit', qty: 1 },
        { name: 'Copper Pipe 1/4"', qty: 3 }
      ],
      moreCount: 2
    }
  ];

  completedRequests: MaterialRequest[] = [
    {
      id: '#402',
      requester: 'Saman Perera',
      date: '2025-02-18',
      location: 'Colombo 03',
      status: 'available',
      items: [
        { name: 'LG Inverter 12k - Outdoor Unit', qty: 1 },
        { name: 'LG Inverter 12k - Indoor Unit', qty: 1 },
        { name: 'Copper Pipe 1/4"', qty: 3 }
      ],
      moreCount: 2
    }
  ];

  setActiveTab(tab: 'pending' | 'reserved' | 'completed') {
    this.activeTab = tab;
  }

  get currentRequests() {
    if (this.activeTab === 'pending') return this.pendingRequests;
    if (this.activeTab === 'reserved') return this.reservedRequests;
    return this.completedRequests;
  }
}
