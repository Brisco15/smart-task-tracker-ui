import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { TaskService } from '../../services/task-service';
import { ProjectService } from '../../services/project-service';
import { TimeTracking } from '../../services/time-tracking';
import { CommonModule } from '@angular/common';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  @ViewChild('statusChart') statusCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('projectChart') projectCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('timeChart') timeCanvas?: ElementRef<HTMLCanvasElement>;

  tasks: any[] = [];
  projects: any[] = [];
  stats = {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalProjects: 0,
    totalTime: 0,
    activeUsers: 0
  };

  chartColors = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#795548', '#607D8B'];
  isLoading = true;
  errorMessage: string | null = null;
  
  private charts: Chart[] = [];
  private destroy$ = new Subject<void>();
  
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private timeTracking = inject(TimeTracking);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.charts.forEach(chart => chart.destroy());
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    this.projectService.getAllProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.ngZone.run(() => {
            this.projects = Array.isArray(response) ? response.filter((p: any) => !p.archived) : [];
            this.stats.totalProjects = this.projects.length;
            
            if (this.projects.length > 0) {
              this.loadTasksAndTime();
            } else {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.errorMessage = 'Failed to load dashboard data.';
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  private loadTasksAndTime() {
    const taskRequests = this.projects.map(p => this.taskService.getTasksByProject(p.projectID));
    const timeRequests = this.projects.map(p => this.timeTracking.getTotalTime(p.projectID));

    forkJoin({ tasks: forkJoin(taskRequests), times: forkJoin(timeRequests) })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ tasks, times }) => {
          this.ngZone.run(() => {
            this.tasks = (tasks as any[]).flat().filter((t: any) => !t.archived);
            this.calculateStats();
            
            const timesArray = Array.isArray(times) ? times : [times];
            this.stats.totalTime = timesArray.reduce((sum: number, time: any) => sum + (time || 0), 0);
            
            this.isLoading = false;
            this.cdr.detectChanges();
            
            setTimeout(() => {
              this.renderCharts();
            }, 100);
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.errorMessage = 'Failed to load tasks.';
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  private calculateStats() {
    this.stats.totalTasks = this.tasks.length;
    this.stats.completedTasks = this.tasks.filter(t => t.status?.statusName?.toLowerCase() === 'completed').length;
    this.stats.inProgressTasks = this.tasks.filter(t => t.status?.statusName?.toLowerCase() === 'in progress').length;
    this.stats.activeUsers = new Set(this.tasks.filter(t => t.assignedTo).map(t => t.assignedTo)).size;
  }

  private renderCharts() {
    if (!this.statusCanvas || !this.priorityCanvas || !this.projectCanvas || !this.timeCanvas) {
      return;
    }

    if (this.tasks.length === 0) {
      return;
    }

    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    this.renderStatusChart();
    this.renderPriorityChart();
    this.renderProjectChart();
    this.renderTimeChart();
  }

  private renderStatusChart() {
    if (!this.statusCanvas) return;

    const statusCounts: { [key: string]: number } = {};
    this.tasks.forEach(task => {
      const status = task.status?.statusName || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const chart = new Chart(this.statusCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: this.chartColors.slice(0, Object.keys(statusCounts).length)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    this.charts.push(chart);
  }

  private renderPriorityChart() {
    if (!this.priorityCanvas) return;

    const priorityCounts: { [key: string]: number } = {};
    this.tasks.forEach(task => {
      const priority = task.priority?.priorityName || 'Unknown';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });

    const chart = new Chart(this.priorityCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(priorityCounts),
        datasets: [{
          label: 'Tasks',
          data: Object.values(priorityCounts),
          backgroundColor: this.chartColors.slice(0, Object.keys(priorityCounts).length)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });

    this.charts.push(chart);
  }

  private renderProjectChart() {
    if (!this.projectCanvas) return;

    const projectData = this.projects.map(project => {
      const projectTasks = this.tasks.filter(t => t.projectID === project.projectID);
      const completed = projectTasks.filter(t => t.status?.statusName?.toLowerCase() === 'completed').length;
      return {
        name: project.projectName,
        completion: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0
      };
    });

    const chart = new Chart(this.projectCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: projectData.map(p => p.name),
        datasets: [{
          label: 'Completion %',
          data: projectData.map(p => p.completion),
          backgroundColor: this.chartColors[0]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: (value) => value + '%' }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private renderTimeChart() {
    if (!this.timeCanvas) return;

    const timeData = this.projects.map(project => ({
      name: project.projectName,
      taskCount: this.tasks.filter(t => t.projectID === project.projectID).length
    }));

    const chart = new Chart(this.timeCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: timeData.map(p => p.name),
        datasets: [{
          label: 'Tasks',
          data: timeData.map(p => p.taskCount),
          backgroundColor: this.chartColors[1]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });

    this.charts.push(chart);
  }

  refresh() {
    this.loadData();
  }

  formatTime(seconds: number): string {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  }
}
