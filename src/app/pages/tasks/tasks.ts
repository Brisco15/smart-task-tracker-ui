import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { ProjectDTO } from '../../interfaces/ProjectDTO';
import { TaskDTO } from '../../interfaces/TaskDTO';
import { HttpClient } from '@angular/common/http';
import { MatCheckbox } from '@angular/material/checkbox';
import { ProjectService } from '../../services/project-service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Auth } from '../../services/auth';
import { TaskService } from '../../services/task-service';
import { Projects } from '../projects/projects';
import { CreateTaskDialog } from '../create-task-dialog/create-task-dialog';



@Component({
  selector: 'app-tasks',
  imports: [CommonModule, MatPaginator, MatPaginatorModule, MatTableModule, MatButtonModule, MatCheckbox, MatDialogModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit, AfterViewInit, OnDestroy {
  tasks: TaskDTO[] = [];
  error: string | null = null;
  dataSource = new MatTableDataSource<TaskDTO>([]);
  displayedColumns: string[] = ['taskID','title','description','assignedTo','statusID','priorityID','actions'];
  http = inject(HttpClient);
  router = inject(Router);
  isLoadingTasks = false;
  showDebugPanel = false;
  projectId!: number;
  currentProjectName: string = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  

  constructor(
    private taskService: TaskService,
    private dialog: MatDialog,
    private authService: Auth,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private route: ActivatedRoute
  ){

  }
  

  ngOnInit(): void {
    console.log('🔄 Tasks component initialized');
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    console.log('💻 Project ID from route:', this.projectId);
    this.loadTasks();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    console.log('🔗 Paginator connected:', this.paginator);
    
    // Force reconnect paginator after view init
    setTimeout(() => {
      if (this.paginator && this.dataSource.data.length > 0) {
        this.dataSource.paginator = this.paginator;
        console.log('🔗 Paginator re-connected after timeout');
      }
    }, 0);
  }

  ngOnDestroy(): void {
    console.log('🔄 Tasks component destroyed');
  }

  // Force refresh method
  forceRefresh(): void {
    console.log('🔄 Force refresh triggered');
    this.error = null;
    this.tasks = [];
    this.dataSource.data = [];
    this.currentProjectName = '';
    this.loadTasks();
  }

  // Fallback method to load project name separately
  private loadProjectName(): void {
    console.log('🔄 Loading project name for ID:', this.projectId);
    this.projectService.getProject(this.projectId).subscribe({
      next: (project: any) => {
        this.currentProjectName = project.projectName || 'Unknown Project';
        console.log('✅ Project name loaded:', this.currentProjectName);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error loading project name:', error);
        this.currentProjectName = `Project ${this.projectId}`;
        this.cdr.markForCheck();
      }
    });
  }

  
  createTask(){

    const userRole = this.authService.getUserRole();
    console.log('current Role:', userRole);
    
    if(userRole !== 'Manager'){
      alert('You do not have permission to perform this action');
      return;
    }

    const dialogRef = this.dialog.open(CreateTaskDialog, {
      data: {projectID: this.projectId},
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        const taskExists = this.tasks.some(t => t.title === result.title);
        if(taskExists){
          alert('There is already a task with this title. Please try another title.');
          return;
        }

        const currentUserID = this.authService.getCurrentUserID();

        const newTask = {
          title: result.title,
          description: result.description,
          projectID: this.projectId,
          priorityID: result.priorityID,
          assignedTo: result.assignedTo,
          createdBy: currentUserID,
          createdAt: new Date,
          archived: false,
        };
        console.log('📤 Sending task to backend:', newTask);

        this.taskService.postTask(newTask).subscribe({
          next: (response: any)=> {
            console.log('✅ Task created successfully:', response);
            alert(' Task successfully created');
            this.loadTasks(); 
            this.isLoadingTasks = false;
            this.cdr.markForCheck();
          },
          error: (error: any) => {
            console.error('❌ Error creating task:', error);
            console.error('Error status:', error.status);
            console.error('Error response:', error.error);
  
            if (error.status === 400) {
              alert(`Failed to create task: ${error.error?.message || error.error || 'Bad Request'}`);
            } else if (error.status === 409) {
              alert('A task with this title already exists');
            } else if (error.status === 403) {
              alert('You do not have permission to create a task');
            } else {
              alert('Failed to create a task. Please try again.');
            }
            this.isLoadingTasks = false;
            this.cdr.markForCheck();
          }
        })
         
      }
    })
  }

  editTask(taskID: number){}

  deleteTask(taskID: number){
    const userRole = this.authService.getUserRole();
    if(userRole !== 'Manager'){
      alert('You do not have permission to perform this action');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this task?')) return;
    this.taskService.deleteTask(taskID).subscribe({
      next: () => {
        alert('Task deleted successfully');
        this.loadTasks();
      },
      error: (error)=>{
        console.error('Error deleting task:', error);
        if(error.status === 403){
          alert('You do not have permission to perform this action')
        }else {
          alert('Failed to delete the task')
        } 
      }
    })
  }

  archiveTask(taskID: number){}

  loadTasks(){
    console.log('🔄 loadTasks() called for project:', this.projectId);
    this.isLoadingTasks = true;
    this.error = null;
    
    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (data: any) => {
        console.log('📥 Raw tasks data received:', data);
        console.log('📊 Data type:', typeof data);
        console.log('📊 Is Array:', Array.isArray(data));
        
        const activeTasks = Array.isArray(data) ? data.filter((task: TaskDTO) => !task.archived) : [];
        console.log('✅ Active tasks after filter:', activeTasks);
        console.log('✅ Active tasks count:', activeTasks.length);
        
        this.tasks = activeTasks;
        this.dataSource.data = activeTasks;
        
        // Extract project name from first task if available
        if (activeTasks.length > 0 && activeTasks[0].project) {
          this.currentProjectName = activeTasks[0].project.projectName;
          console.log('✅ Project name extracted:', this.currentProjectName);
        } else {
          // Fallback: load project name separately
          this.loadProjectName();
        }
        
        // Paginator nach Datenaktualisierung neu setzen
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
          console.log('✅ Paginator re-connected');
        }
        
        this.isLoadingTasks = false;
        this.cdr.markForCheck();
        
        console.log('✅ Final state - DataSource.data.length:', this.dataSource.data.length);
        console.log('✅ Final state - isLoadingTasks:', this.isLoadingTasks);
        console.log('✅ Final state - error:', this.error);
        console.log('✅ Final state - Should show table?', !this.isLoadingTasks && this.dataSource.data.length > 0);
      },
      error: (error) => {
        console.error('❌ Error loading tasks:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        
        if(error.status === 401 || error.status === 403){
          console.log('🔄 Auth error, redirecting to login');
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          this.router.navigateByUrl('/login');
        } else if (error.status === 0) {
          console.log('❌ No internet connection or CORS issue');
          this.error = 'Network error. Please check your connection and try again.';
        } else {
          console.log('❌ API Error:', error);
          this.error = `Failed to load tasks (Error: ${error.status || 'Unknown'})`;
        }
        this.isLoadingTasks = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  // Helper method for debugging
  getDebugInfo(): any {
    const token = localStorage.getItem('token');
    return {
      hasToken: !!token,
      projectId: this.projectId,
      currentProjectName: this.currentProjectName,
      tasksCount: this.tasks.length,
      dataSourceCount: this.dataSource.data.length,
      isLoading: this.isLoadingTasks,
      error: this.error,
      showTable: !this.isLoadingTasks && this.dataSource.data.length > 0,
      hasPaginator: !!this.paginator
    };
  }

}

