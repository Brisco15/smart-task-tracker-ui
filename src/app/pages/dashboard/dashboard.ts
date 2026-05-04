import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { TaskService } from '../../services/task-service';
import { ProjectService } from '../../services/project-service';
import { TimeTracking } from '../../services/time-tracking';
import { CommonModule } from '@angular/common';
import { forkJoin, Subject, of } from 'rxjs';
import { takeUntil, finalize, catchError, map } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalProjects: number;
  totalTime: number;
  activeUsers: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  // Data properties
  tasks: any[] = [];
  projects: any[] = [];
  users: any[] = [];
  stats: DashboardStats = {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalProjects: 0,
    totalTime: 0,
    activeUsers: 0
  };

  // UI State
  isLoading = true;
  errorMessage: string | null = null;

  // Charts
  private charts: { [key: string]: Chart } = {};
  private destroy$ = new Subject<void>();
  
  // Services
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private timeTracking = inject(TimeTracking);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    // ✅ Cleanup: Destroy all charts
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.errorMessage = null;

    this.projectService.getAllProjects()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.projects = Array.isArray(response) ? response.filter((p: any) => !p.archived) : [];
          this.stats.totalProjects = this.projects.length;
          
          console.log('📊 Projects loaded:', this.projects.length);
          
          if (this.projects.length > 0) {
            this.loadAllTasks();
          } else {
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('❌ Error loading projects:', error);
          this.errorMessage = 'Failed to load dashboard data. Please try again.';
          this.projects = [];
        }
      });
  }

  loadAllTasks() {
    if (this.projects.length === 0) return;

    const taskRequests = this.projects.map(project => 
      this.taskService.getTasksByProject(project.projectID)
    );

    forkJoin(taskRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: any) => {
          this.tasks = results.flat().filter((task: any) => !task.archived);
          this.calculateStatistics();
          
          console.log('📋 Total tasks loaded:', this.tasks.length);
          
          // ✅ Load time tracking data for all tasks
          this.loadTaskTimesAndRender();
        },
        error: (error) => {
          console.error('❌ Error loading tasks:', error);
          this.tasks = [];
          this.errorMessage = 'Failed to load tasks.';
        }
      });
  }

  // ✅ NEW: Load time tracking data for each task
  loadTaskTimesAndRender() {
    if (this.tasks.length === 0) {
      this.calculateTotalTime();
      return;
    }

    // Get unique task IDs
    const taskIds = [...new Set(this.tasks.map(t => t.taskID))];
    
    console.log('⏱️ Loading time tracking for', taskIds.length, 'tasks');

    // Load time tracking for each task
    const timeRequests = taskIds.map(taskId =>
      this.timeTracking.getTimeTrackingByTask(taskId).pipe(
        map((time: any) => ({ taskId, time })),
        catchError(() => of({ taskId, time: 0 }))
      )
    );

    forkJoin(timeRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: any[]) => {
          // ✅ Map time data to tasks
          results.forEach(result => {
            const task = this.tasks.find(t => t.taskID === result.taskId);
            if (task) {
              // Time is in minutes from API, convert to seconds
              task.timeSpent = result.time * 60;
            }
          });

          console.log('✅ Time tracking data loaded');
          console.log('Tasks with time:', this.tasks.filter(t => t.timeSpent > 0).length);
          
          // Calculate total time
          this.calculateTotalTime();
          
          // Render charts with actual data
          setTimeout(() => {
            this.renderAllCharts();
          }, 300);
        },
        error: (error) => {
          console.error('❌ Error loading time tracking:', error);
          // Continue without time data
          this.calculateTotalTime();
          setTimeout(() => {
            this.renderAllCharts();
          }, 300);
        }
      });
  }

  calculateStatistics() {
    this.stats.totalTasks = this.tasks.length;
    this.stats.completedTasks = this.tasks.filter(t => 
      t.status?.statusName?.toLowerCase() === 'completed'
    ).length;
    this.stats.inProgressTasks = this.tasks.filter(t => 
      t.status?.statusName?.toLowerCase() === 'in progress'
    ).length;
    
    const uniqueUsers = new Set(
      this.tasks
        .filter(t => t.assignedTo)
        .map(t => t.assignedTo)
    );
    this.stats.activeUsers = uniqueUsers.size;
  }

  calculateTotalTime() {
    if (this.projects.length === 0) {
      this.stats.totalTime = 0;
      return;
    }

    const timeRequests = this.projects.map(project =>
      this.timeTracking.getTotalTime(project.projectID).pipe(
        catchError(() => of(0))
      )
    );

    forkJoin(timeRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (times: any) => {
          const timesArray = Array.isArray(times) ? times : [times];
          this.stats.totalTime = timesArray.reduce((sum: number, time: number) => sum + (time || 0), 0);
          console.log('⏱️ Total time:', this.stats.totalTime, 'seconds');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error calculating total time:', error);
          this.stats.totalTime = 0;
        }
      });
  }

  renderAllCharts() {
    console.log('🎨 Rendering charts...');
    this.loadTaskStatusChart();
    this.loadTimeChart();
    this.loadProjectChart();
    this.loadPriorityChart();
  }

  formatTime(seconds: number): string {
    if (!seconds || seconds === 0) return '0m';
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${seconds}s`;
  }

  loadTaskStatusChart() {
    const canvas = document.getElementById('taskStatusChart') as HTMLCanvasElement;
    if (!canvas || this.tasks.length === 0) return;

    if (this.charts['taskStatus']) {
      this.charts['taskStatus'].destroy();
    }

    const statusCounts: { [key: string]: number } = {};
    this.tasks.forEach(task => {
      const status = task.status?.statusName || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: [
            '#4CAF50',
            '#2196F3',
            '#FF9800',
            '#F44336',
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, font: { size: 12 } }
          },
          title: {
            display: true,
            text: 'Task Status Distribution',
            font: { size: 16, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed ?? 0;
                const total = this.tasks.length;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.charts['taskStatus'] = new Chart(canvas, config);
  }

  loadTimeChart() {
    const canvas = document.getElementById('timeChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts['time']) {
      this.charts['time'].destroy();
    }

    // ✅ Filter tasks with actual time spent
    const sortedTasks = [...this.tasks]
      .filter(t => t.timeSpent && t.timeSpent > 0)
      .sort((a, b) => (b.timeSpent || 0) - (a.timeSpent || 0))
      .slice(0, 10);

    console.log('📊 Tasks with time for chart:', sortedTasks.length);
    sortedTasks.forEach(t => {
      console.log(`  - ${t.title}: ${this.formatTime(t.timeSpent)}`);
    });

    if (sortedTasks.length === 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No time tracking data available', canvas.width / 2, canvas.height / 2);
      }
      return;
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: sortedTasks.map(t => t.title.substring(0, 20) + (t.title.length > 20 ? '...' : '')),
        datasets: [{
          label: 'Time Spent (minutes)',
          data: sortedTasks.map(t => Math.round((t.timeSpent || 0) / 60)),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value}m`
            }
          }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Time Spent per Task (Top 10)',
            font: { size: 16, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const minutes = context.parsed?.y ?? 0;
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                return `Time: ${hours}h ${remainingMinutes}m`;
              }
            }
          }
        }
      }
    };

    this.charts['time'] = new Chart(canvas, config);
  }

  loadProjectChart() {
    const canvas = document.getElementById('projectChart') as HTMLCanvasElement;
    if (!canvas || this.projects.length === 0) return;

    if (this.charts['project']) {
      this.charts['project'].destroy();
    }

    const projectData = this.projects.map(project => {
      const projectTasks = this.tasks.filter(t => t.projectID === project.projectID);
      const completedTasks = projectTasks.filter(t => 
        t.status?.statusName?.toLowerCase() === 'completed'
      ).length;
      const percentage = projectTasks.length > 0 
        ? Math.round((completedTasks / projectTasks.length) * 100) 
        : 0;
      
      return {
        name: project.projectName,
        completion: percentage,
        taskCount: projectTasks.length
      };
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: projectData.map(p => p.name),
        datasets: [{
          label: 'Completion %',
          data: projectData.map(p => p.completion),
          backgroundColor: projectData.map(p => 
            p.completion === 100 ? 'rgba(76, 175, 80, 0.6)' :
            p.completion >= 50 ? 'rgba(33, 150, 243, 0.6)' :
            'rgba(255, 152, 0, 0.6)'
          ),
          borderColor: projectData.map(p => 
            p.completion === 100 ? 'rgba(76, 175, 80, 1)' :
            p.completion >= 50 ? 'rgba(33, 150, 243, 1)' :
            'rgba(255, 152, 0, 1)'
          ),
          borderWidth: 2,
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { 
              callback: (value) => {
                const numValue = typeof value === 'number' ? value : 0;
                return `${numValue}%`;
              }
            }
          }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Project Completion',
            font: { size: 16, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const index = context.dataIndex;
                if (index >= 0 && index < projectData.length) {
                  const project = projectData[index];
                  return `Tasks: ${project.taskCount}`;
                }
                return '';
              }
            }
          }
        }
      }
    };

    this.charts['project'] = new Chart(canvas, config);
  }

  loadPriorityChart() {
    const canvas = document.getElementById('priorityChart') as HTMLCanvasElement;
    if (!canvas || this.tasks.length === 0) return;

    if (this.charts['priority']) {
      this.charts['priority'].destroy();
    }

    const priorityCounts: { [key: string]: number } = {};
    this.tasks.forEach(task => {
      const priority = task.priority?.priorityName || 'Unknown';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: Object.keys(priorityCounts),
        datasets: [{
          label: 'Task Count',
          data: Object.values(priorityCounts),
          backgroundColor: Object.keys(priorityCounts).map(priority => {
            if (priority.toLowerCase() === 'high') return 'rgba(244, 67, 54, 0.6)';
            if (priority.toLowerCase() === 'medium') return 'rgba(255, 152, 0, 0.6)';
            return 'rgba(76, 175, 80, 0.6)';
          }),
          borderColor: Object.keys(priorityCounts).map(priority => {
            if (priority.toLowerCase() === 'high') return 'rgba(244, 67, 54, 1)';
            if (priority.toLowerCase() === 'medium') return 'rgba(255, 152, 0, 1)';
            return 'rgba(76, 175, 80, 1)';
          }),
          borderWidth: 2,
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Priority Distribution',
            font: { size: 16, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          }
        }
      }
    };

    this.charts['priority'] = new Chart(canvas, config);
  }

  // ✅ Refresh functionality
  refresh() {
    // Destroy existing charts
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};
    
    // Reload data
    this.loadDashboardData();
  }
}
