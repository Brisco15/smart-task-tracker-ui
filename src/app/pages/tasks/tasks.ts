import { ChangeDetectorRef, Component, inject, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { TaskDTO } from '../../interfaces/TaskDTO';
import { HttpClient } from '@angular/common/http';
import { MatCheckbox } from '@angular/material/checkbox';
import { ProjectService } from '../../services/project-service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Auth } from '../../services/auth';
import { TaskService } from '../../services/task-service';
import { CreateTaskDialog } from '../create-task-dialog/create-task-dialog';
import { EditTaskDialog } from '../edit-task-dialog/edit-task-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TimeTracking } from '../../services/time-tracking';


@Component({
  selector: 'app-tasks',
  imports: [CommonModule,MatCardModule ,MatIconModule, MatPaginator, MatPaginatorModule, MatTableModule, MatButtonModule, MatCheckbox, MatDialogModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit, AfterViewInit, OnDestroy {
  tasks: TaskDTO[] = [];
  error: string | null = null;
  dataSource = new MatTableDataSource<TaskDTO>([]);
  displayedColumns: string[] = ['taskID','title','description','assignedTo','statusID','priorityID','timeSpent','actions'];
  http = inject(HttpClient);
  router = inject(Router);
  isLoadingTasks = false;
  
  projectId!: number;
  currentProjectName: string = '';
  taskTimes: { [taskID: number]: number} = {};
  runningTasks: { [taskID: number]: boolean} = {};
  
  // ✅ Normale Variable, kein Signal!
  totalProjectTime: number = 0;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  constructor(
    private taskService: TaskService,
    private dialog: MatDialog,
    private authService: Auth,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private timeTracking: TimeTracking
  ){}

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.loadTasks();
    this.loadTaskTimes();
    this.loadTotalTimePerProject();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    console.log('🔗 Paginator connected:', this.paginator);
    
    // Force reconnect paginator after view init
    setTimeout(() => {
      if (this.paginator && this.dataSource.data.length > 0) {
        this.dataSource.paginator = this.paginator; 
      }
    }, 0);
  }

  ngOnDestroy(): void {
    
  }

 
  // Fallback method to load project name separately
  private loadProjectName(): void {
    // Call the service to get project details
    this.projectService.getProject(this.projectId).subscribe({
      next: (project: any) => {
        this.currentProjectName = project.projectName || 'Unknown Project';
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.currentProjectName = `Project ${this.projectId}`;
        this.cdr.markForCheck();
      }
    });
  }

  
  createTask(){
    // Check user role before allowing task creation
    const userRole = this.authService.getUserRole();
    // Only Managers are allowed to create tasks
    if(userRole !== 'Manager'){
      alert('You do not have permission to perform this action');
      return;
    }
    // Open the create task dialog
    const dialogRef = this.dialog.open(CreateTaskDialog, {
      data: {projectID: this.projectId},
      width: '400px'
    });
    // Handle the dialog close event
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        const taskExists = this.tasks.some(t => t.title === result.title);
        if(taskExists){
          alert('There is already a task with this title. Please try another title.');
          return;
        }
        // Get the current user ID for the createdBy field
        const currentUserID = this.authService.getCurrentUserID();
        // Create a new task object based on the dialog result
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
        
        // Call the service to create the task
        this.taskService.postTask(newTask).subscribe({
          next: (response: any)=> {
            
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

  // Method to edit a task
  editTask(taskID: number){
    const userRole = this.authService.getUserRole();
    if(userRole === 'Admin'){
      alert('You do not have permission to perform this action');
      return;
    }

    // Find the task to edit
    const taskToEdit = this.tasks.find(t => t.taskID === taskID);
    if(!taskToEdit){
      alert('Task not found');
      return;
    }

    // Open the edit dialog with the task data
    const dialogRef = this.dialog.open(EditTaskDialog, {
      width: '600px',
      data: {task: taskToEdit}
    });

    // Handle the dialog close event
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        
        const updatedTask = {
          title: result.title,
          description: result.description,
          assignedTo: result.assignedTo,
          statusID: result.statusID,
          priorityID: result.priorityID
        };

        this.taskService.updateTaskByProject(this.projectId, taskID, updatedTask).subscribe({
          next: () => {
            alert('Task successfully updated')
            this.loadTasks()
          },
          error: (error) => {
            console.error('❌ Error updating task:', error);
            console.error('Error status:', error.status);
            console.error('Error details:', error.error);
          
            if (error.status === 403) {
              alert('You do not have permission to edit this task');
            } else if(error.status === 409){
              alert('A task with this title already exists');
            } else if (error.status === 500){
              alert('Server error. Please check the backend logs');
            } else {
              alert('Failed to update task');
            }
          }
        })
        
      }
    })
  }

  // Method to delete a task
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

  archiveTask(taskID: number){

    const userRole = this.authService.getUserRole();
    if(userRole === 'Developer'){
      alert('You do not have permission to perform this action')
      
      return;
    }

    if(!confirm('Are you sure you want to archive this task?'))
     
      return;

    this.taskService.archiveTask(taskID).subscribe({
      next: (response: any)=>{
        console.log('✅ Task archived successfully:', response);
        alert('Task archived successfully');
        this.loadTasks();
      },
      error: (error)=> {
        console.error('Error archiving task:', error);
        if(error.status === 403){
          alert('You do not have permission to perform this action')
        }else{
          alert('Failed to archive task')
        }
        
      }
    })
  }
  // Method to load tasks for the current project
  loadTasks(){
    
    this.isLoadingTasks = true;
    this.error = null;
    
    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (data: any) => {
        const activeTasks = Array.isArray(data) ? data.filter((task: TaskDTO) => !task.archived) : [];
        this.tasks = activeTasks;
        this.dataSource.data = activeTasks;
        
        // Extract project name from first task if available
        if (activeTasks.length > 0 && activeTasks[0].project) {
          this.currentProjectName = activeTasks[0].project.projectName;
        } else {
          // Fallback: load project name separately
          this.loadProjectName();
        }
        
        // Paginator nach Datenaktualisierung neu setzen
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        
        this.isLoadingTasks = false;
        
        // ✅ Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('❌ Error loading tasks:', error);
        
        if(error.status === 401 || error.status === 403){
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          this.router.navigateByUrl('/login');
        } else if (error.status === 0) {
          this.error = 'Network error. Please check your connection and try again.';
        } else {
          this.error = `Failed to load tasks (Error: ${error.status || 'Unknown'})`;
        }
        this.isLoadingTasks = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Method to check if a task is currently being tracked
  isRunning(taskID: number){
    return this.runningTasks[taskID] === true;
  }

  // Separate method to start time tracking for a task
  start(taskID: number): void{
    const currentUserID = this.authService.getCurrentUserID();
    const assignedTo = this.tasks.find(t => t.taskID === taskID)?.assignedTo;
    // Check if the current user is assigned to the task before allowing time tracking
    if (assignedTo !== currentUserID) {
      alert('You can only track time for tasks assigned to you!');
      return;
    }

    this.timeTracking.startTimeTracking(taskID).subscribe({
      next: (response)=>{
        this.runningTasks[taskID] = true;
        this.cdr.detectChanges();
        alert('time tracking started');
      },
      error: (error) => {
        console.error('❌ Error starting time tracking:', error);
        if (error.status === 400) {
          alert('You already have an active time tracking!');
        } else if (error.status === 403) {
          alert('You do not have permission to track time!');
        } else {
          alert('Failed to start time tracking');
        }
      }
    });

  }

  // Separate method to stop time tracking for a task
  stop(taskID: number): void{
    this.timeTracking.stopTimeTracking(taskID).subscribe({
      next: (response)=>{
        this.runningTasks[taskID] = false;
        
        // ✅ Reload data after stopping
        setTimeout(() => {
          this.loadTaskTimes();
          this.loadTotalTimePerProject();
          this.cdr.detectChanges();
        }, 100);
        
        alert('Time tracking stopped');
      },
      error: (error) => {
        console.error('❌ Error stopping time tracking:', error);
        if (error.status === 404) {
          alert('No active time tracking found for this task!');
        } else if (error.status === 403) {
          alert('You do not have permission to stop time tracking!');
        } else {
          alert('Failed to stop time tracking');
        }
      }
    }); 
  }

// Separate method to load time spent on each task
loadTaskTimes(){
  this.timeTracking.getTimeTrackingByProject(this.projectId).subscribe({
    next: (data: any) => {
      console.log('📊 Task times data received:', data);
      
      if (Array.isArray(data)) {
        const newTaskTimes: { [taskID: number]: number } = {};
        
        data.forEach(item => {
          newTaskTimes[item.taskID] = item.totalDuration * 60;
        });
        
        this.taskTimes = newTaskTimes;
        console.log('✅ Task times updated:', this.taskTimes);
      } else {
        console.warn('⚠️ Expected array but got:', typeof data);
      }
      
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('❌ Error loading task times:', error);
      if (error.status !== 404) {
        console.warn('⚠️ Failed to load task times, but continuing...');
      }
      this.cdr.detectChanges();
    }
  });
}
  // Separate method to load total time for the project
  loadTotalTimePerProject(){
    this.timeTracking.getTotalTime(this.projectId).subscribe({
      next: (data) => {
        console.log('📊 Total time data received:', data);
        
        // ✅ Direkt als Zahl zuweisen
        this.totalProjectTime = typeof data === 'number' ? data : 0;
        
        console.log('⏱️ Total project time set to:', this.totalProjectTime);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading total time:', error);
        this.totalProjectTime = 0;
        this.cdr.detectChanges();
      }
    });
  }

  // Helper method to format time in seconds to "Xh Ym" format
  formatTime(seconds: number): string {
    if(!seconds || seconds === 0) {
      return '0m';
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  }
  
  
}

