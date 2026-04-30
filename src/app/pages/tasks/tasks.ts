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
import { TimeTracking } from '../../services/time-tracking';


@Component({
  selector: 'app-tasks',
  imports: [CommonModule,MatIconModule, MatPaginator, MatPaginatorModule, MatTableModule, MatButtonModule, MatCheckbox, MatDialogModule],
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
  showDebugPanel = false;
  projectId!: number;
  currentProjectName: string = '';
  taskTimes: { [taskID: number]: number} = {};
  runningTasks: { [taskID: number]: boolean} = {};
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
    console.log('🔄 Tasks component initialized');
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    console.log('💻 Project ID from route:', this.projectId);
    this.loadTasks();
    this.loadTaskTimes();
    console.log(' Time track:', this.loadTaskTimes);
    
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

  editTask(taskID: number){
    const userRole = this.authService.getUserRole();
    if(userRole === 'Admin'){
      alert('You do not have permission to perform this action');
      return;
    }

    const taskToEdit = this.tasks.find(t => t.taskID === taskID);
    if(!taskToEdit){
      alert('Task not found');
      return;
    }

    const dialogRef = this.dialog.open(EditTaskDialog, {
      width: '600px',
      data: {task: taskToEdit}
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        console.log('Dialog result:', result);

        const updatedTask = {
          title: result.title,
          description: result.description,
          assignedTo: result.assignedTo,
          statusID: result.statusID,
          priorityID: result.priorityID
        };

        console.log('📤 Sending update to backend:', updatedTask);
        this.taskService.updateTaskByProject(this.projectId, taskID, updatedTask).subscribe({
          next: () => {
            console.log('✅ Task updated successfully');
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

  isRunning(taskID: number){
    return this.runningTasks[taskID] === true;
  }

  start(taskID: number): void{
    console.log('Starting time tracking:', taskID);
    this.timeTracking.startTimeTracking(taskID).subscribe({
      next: (response)=>{
        console.log('time tracking started:', response);
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

  stop(taskID: number): void{
    console.log('stopping time tracking for task:', taskID);
    
    this.timeTracking.stopTimeTracking(taskID).subscribe({
      next: (response)=>{
        console.log('Time tracking stopped:', response);
        this.runningTasks[taskID] = false;
        this.loadTaskTimes();
        this.cdr.detectChanges();
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


  loadTaskTimes(){
    console.log('⏱️ Loading task times for project:', this.projectId);
    this.timeTracking.getTimeTrackingByProject(this.projectId).subscribe({
      next: (data)=>{
        console.log('📊 Task times received:', data);
        data.forEach( item =>{
        this.taskTimes[item.taskID] = item.totalDuration * 60;
        console.log('✅ Task times loaded:', this.taskTimes);
        this.cdr.detectChanges();
      })
    },
   error: (error) => {
     console.error('❌ Error loading task times:', error);
     // Ignore error 404 in case there is no time tracking
     if (error.status !== 404) {
       console.warn('⚠️ Failed to load task times, but continuing...');
     }
   }
  });
  }

  formatTime(seconds: number): string {
    if(!seconds || seconds === 0) {
      return '0m';
    }

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    return `${h > 0 ? h + 'h ' : ''}${m}m`;
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

