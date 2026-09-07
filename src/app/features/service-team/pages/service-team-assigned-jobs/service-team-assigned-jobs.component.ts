import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TaskService, Task } from '../../services/task.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-service-team-assigned-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './service-team-assigned-jobs.component.html',
  styleUrl: './service-team-assigned-jobs.component.css'
})
export class ServiceTeamAssignedJobsComponent implements OnInit {
  tasks: any[] = [];
  filteredTasks: any[] = [];
  searchQuery: string = '';
  statusFilter: string = 'All';

  private readonly assignedStageStatuses = new Set([
    'assigned',
    'scheduled',
    'pending',
    'finance approved',
    'sent to im',
  ]);

  constructor(private taskService: TaskService, private router: Router) {}

  get baseRoute(): string {
    const url = decodeURIComponent(this.router.url);
    if (url.includes('/service-team-a') || url.includes('/service team a')) return '/service-team-a';
    if (url.includes('/service-team-b') || url.includes('/service team b')) return '/service-team-b';
    return '/service-team';
  }

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        if (Array.isArray(tasks) && tasks.length > 0) {
          this.tasks = tasks;
        } else {
          this.tasks = [];
        }
        this.filterTasks();
      },
      error: () => {
        this.tasks = [];
        this.filterTasks();
      }
    });
  }

  filterTasks() {
    const normalizedSearch = (this.searchQuery || '').toLowerCase();
    const normalizedFilter = this.normalizeStatus(this.statusFilter);

    this.filteredTasks = this.tasks.filter(task => {
      const taskId = String(task?.sourceId || task?.id || '').toLowerCase();
      const customerName = String(task?.customer?.name || task?.customer || '').toLowerCase();
      const taskStatus = this.normalizeStatus(task?.status);

      const matchesSearch = 
        taskId.includes(normalizedSearch) ||
        customerName.includes(normalizedSearch);
      
      const matchesStatus = 
        this.statusFilter === 'All' || 
        taskStatus === normalizedFilter ||
        (normalizedFilter === 'assigned' && this.assignedStageStatuses.has(taskStatus));

      return matchesSearch && matchesStatus;
    });
  }

  displayStatus(status: string): string {
    const value = String(status || '').trim();
    return value || 'Unknown';
  }

  statusClass(status: string): string {
    const normalized = this.normalizeStatus(status);
    return normalized.replace(/[\s_]+/g, '-');
  }

  private normalizeStatus(status: string): string {
    return String(status || '').trim().toLowerCase();
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = 'All';
    this.filterTasks();
  }
}
