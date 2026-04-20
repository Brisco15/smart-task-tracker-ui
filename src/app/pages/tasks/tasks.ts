import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ProjectDTO } from '../../interfaces/ProjectDTO';
import { TaskDTO } from '../../interfaces/TaskDTO';
import { HttpClient } from '@angular/common/http';
import { MatCheckbox } from '@angular/material/checkbox';
import { ProjectService } from '../../services/project-service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Auth } from '../../services/auth';

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

  constructor(){

  }

  ngOnInit(): void {
    this.loadTasks()
  }

  createTask(){}

  editTask(taskID: number){}

  deleteTask(taskID: number){}

  archiveTask(taskID: number){}

  loadTasks(){}

}
///////////////////////////////
