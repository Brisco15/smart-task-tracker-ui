import { Component, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ProjectDTO } from '../../interfaces/ProjectDTO';
import { HttpClient } from '@angular/common/http';
import { MatCheckbox } from '@angular/material/checkbox';
import { ProjectService } from '../../services/project-service';


@Component({
  selector: 'app-projects',
  imports: [CommonModule, MatTableModule,MatButton, MatCheckbox],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements OnInit {
  projects: ProjectDTO[] = [];
  error: string | null = null;
  dataSource = new MatTableDataSource<ProjectDTO>([]);
  displayedColumns: string[] = ['projectID', 'projectName', 'description','createdBy', 'startDate', 'endDate', 'actions'];
  http = inject(HttpClient);
  router = inject(Router);
  isLoadingProjects = false;

  constructor(
    private projectService: ProjectService,

  ){}

  ngOnInit(): void {
    
    this.loadProjects()
  }

  getanyLoading(): boolean {
    return this.isLoadingProjects
  }


  createProject(){

  }

  editProject(projectID:number){}

  deleteProject(projectID: number){}

  archiveProject(projectID: number){}

  loadProjects(){}

}
