import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemInfoService, SystemInfo } from '../../core/services/system-info.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent implements OnInit {
  systemInfo: SystemInfo | null = null;
  currentYear = new Date().getFullYear();

  constructor(private systemInfoService: SystemInfoService) {}

  ngOnInit(): void {
    this.systemInfoService.systemInfo$.subscribe((info) => {
      this.systemInfo = info;
    });
  }
}
