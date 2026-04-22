import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
  imports: [CommonModule, MatTableModule, MatButtonModule, MatCheckbox, MatDialogModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit {
  tasks: TaskDTO[] = [];
  error: string | null = null;
  dataSource = new MatTableDataSource<TaskDTO>([]);
  displayedColumns: string[] = ['taskID','title','description','createdBy','projectID','statusID','priorityID','assignedTo','actions'];
  http = inject(HttpClient);
  router = inject(Router);
  isLoadingTasks = false;
  projectId!: number
  

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
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.loadTasks()
  }

  //TODO
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

  deleteTask(taskID: number){}

  archiveTask(taskID: number){}

  loadTasks(){
    return this.taskService.getTasksByProject(this.projectId).subscribe((data: any)=>{
      this.tasks = data;
    })
  }

}

