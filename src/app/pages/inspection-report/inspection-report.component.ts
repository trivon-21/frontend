import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InspectionOfficerService } from '../../services/inspection-officer.service';

interface Room {
  name: string;
  length: number | null;
  width: number | null;
  height: number | null;
  area: number | null;
  sunExposure: number;
  ventilation: number;
  windows: number | null;
  possibleWallLocations: string;
  wallCondition: string;
  spaceAvailability: string;
  outdoorAvailableLocations: string;
  surfaceCondition: string;
  ventilationCondition: string;
  exposureToWeather: string;
  indoorOutdoorDistance: string;
  distanceMeasured: string;
  possibleRoutingPath: string;
  routingPathDescription: string;
  estimatedBends: string;
  drainOutletAvailable: boolean;
  drainType: string;
  drainPathDescription: string;
  obstacles: string[];
  obstacleDetails: string;
  wallDrillingRequired: boolean;
  drillPoints: string;
  verticalHeightDiff: string;
  powerPointsNearby: boolean;
  wiringConditionVisible: boolean;
  earthingAvailability: boolean;
  distanceToBoard: string;
  electricalLimitations: string;
  constraintsRisks: string;
  inspectorNotes: string;
}

interface PhotoEntry {
  name: string;
  dataUrl: string;
}

@Component({
  selector: 'app-inspection-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection-report.component.html',
  styleUrls: ['./inspection-report.component.css']
})
export class InspectionReportComponent implements OnInit {

  currentPage = 1;
  totalPages  = 3;
  obstacleOptions = ['Furniture', 'Beams', 'Electrical wiring', 'Glass panels', 'Plumbing lines', 'Other'];

  // Page 1 — auto filled from URL params
  ticketId      = '';
  customerName  = '';
  contactNumber = '';
  siteAddress   = '';
  siteType      = '';
  inspectionDate = '';
  siteStatus     = 'New';
  floorLevel     = '';
  elevatorAvailability = true;
  parkingAvailability  = '';

  // Rooms
  rooms: Room[] = [this.newRoom()];

  // Page 3
  photoEntries:      PhotoEntry[] = [];
  pendingPhotoName   = '';
  showPhotoNameInput = false;
  pendingPhotoFile:  string | null = null;
  inspectorName      = '';
  acknowledgeDate    = '';

  constructor(
    private route: ActivatedRoute,
    private officerService: InspectionOfficerService
  ) {}

ngOnInit(): void {
  // Auto-fill today's date
  this.acknowledgeDate = new Date().toISOString().split('T')[0];

  this.route.queryParams.subscribe(params => {
    if (params['ticketId'])       this.ticketId       = params['ticketId'];
    if (params['customerName'])   this.customerName   = params['customerName'];
    if (params['contactNumber'])  this.contactNumber  = params['contactNumber'];
    if (params['siteAddress'])    this.siteAddress    = params['siteAddress'];
    if (params['inspectionDate']) this.inspectionDate = params['inspectionDate'];
  });
}

  newRoom(): Room {
    return {
      name: '', length: null, width: null, height: null,
      area: null, sunExposure: 50, ventilation: 50, windows: null,
      possibleWallLocations: '', wallCondition: '', spaceAvailability: '',
      outdoorAvailableLocations: '', surfaceCondition: '',
      ventilationCondition: '', exposureToWeather: '',
      indoorOutdoorDistance: '', distanceMeasured: 'Measured',
      possibleRoutingPath: 'Through wall', routingPathDescription: '',
      estimatedBends: '', drainOutletAvailable: true,
      drainType: 'Gravity drain available', drainPathDescription: '',
      obstacles: [], obstacleDetails: '',
      wallDrillingRequired: false, drillPoints: '', verticalHeightDiff: '',
      powerPointsNearby: true, wiringConditionVisible: false,
      earthingAvailability: true, distanceToBoard: '', electricalLimitations: '',
      constraintsRisks: '', inspectorNotes: ''
    };
  }

  addRoom()  { this.rooms.push(this.newRoom()); }
  removeRoom(i: number) { if (this.rooms.length > 1) this.rooms.splice(i, 1); }

  calcArea(room: Room) {
    if (room.length && room.width) {
      // All in meters — area = L x W
      room.area = parseFloat((room.length * room.width).toFixed(2));
    } else {
      room.area = null;
    }
  }

  toggleObstacle(room: Room, obs: string) {
    const idx = room.obstacles.indexOf(obs);
    if (idx > -1) room.obstacles.splice(idx, 1);
    else room.obstacles.push(obs);
  }

  isObstacleSelected(room: Room, obs: string): boolean {
    return room.obstacles.includes(obs);
  }

  get currentTime(): string {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  triggerPhotoUpload(input: HTMLInputElement) { input.click(); }

  onPhotoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.pendingPhotoFile  = e.target?.result as string;
        this.showPhotoNameInput = true;
        this.pendingPhotoName  = '';
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  confirmPhoto() {
    if (!this.pendingPhotoName.trim()) {
      alert('Please enter a name for the photo.');
      return;
    }
    this.photoEntries.push({
      name:    this.pendingPhotoName.trim(),
      dataUrl: this.pendingPhotoFile!
    });
    this.pendingPhotoFile   = null;
    this.pendingPhotoName   = '';
    this.showPhotoNameInput = false;
  }

  cancelPhoto() {
    this.pendingPhotoFile   = null;
    this.pendingPhotoName   = '';
    this.showPhotoNameInput = false;
  }

  removePhoto(i: number) { this.photoEntries.splice(i, 1); }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo(0, 0);
    }
  }

  submitReport() {
    if (!this.ticketId) {
      alert('No ticket ID found. Please navigate from Ongoing Inspections.');
      return;
    }

    const reportData = {
      customerName:         this.customerName,
      contactNumber:        this.contactNumber,
      siteAddress:          this.siteAddress,
      siteType:             this.siteType,
      inspectionDate:       this.inspectionDate,
      siteStatus:           this.siteStatus,
      floorLevel:           this.floorLevel,
      elevatorAvailability: this.elevatorAvailability,
      parkingAvailability:  this.parkingAvailability,
      rooms:                this.rooms,
      photos:               this.photoEntries,
      inspectorName:        this.inspectorName,
      acknowledgeDate:      this.acknowledgeDate,
      acknowledgeTime:      this.currentTime,
    };

    this.officerService.recordReport(this.ticketId, reportData).subscribe({
      next: () => {
        alert('✅ Inspection report recorded successfully!');
        window.history.back();
      },
      error: (err: any) => {
        console.error(err);
        alert('❌ Failed to record report: ' + err.message);
      }
    });
  }
}