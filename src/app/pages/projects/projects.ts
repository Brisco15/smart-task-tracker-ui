import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ProjectDTO } from '../../interfaces/ProjectDTO';
import { HttpClient } from '@angular/common/http';
import { MatCheckbox } from '@angular/material/checkbox';
import { ProjectService } from '../../services/project-service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';




@Component({
  selector: 'app-projects',
  imports: [CommonModule, MatTableModule,MatButtonModule,MatButton, MatCheckbox, MatDialogModule],
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
    private dialog: MatDialog,
    private cdr : ChangeDetectorRef

  ){}

  ngOnInit(): void {
    
    this.loadProjects()
  }

  loadProjects(){
    this.isLoadingProjects = true;
    this.error = null;
    
    console.log('📥 Calling getAllProjects()...');

    this.projectService.getAllProjects().subscribe({
      next: (data: any) =>{
        console.log('✅ Projects loaded:', data);
        const activeProjects = data.filter((project: ProjectDTO) => !project.archived)
        this.projects = activeProjects;

        this.dataSource.data = activeProjects;
        this.isLoadingProjects = false;

        this.cdr.detectChanges();

        console.log('📊 DataSource updated, count:', this.dataSource.data.length);
      },
      error : (error) => {
        console.error('Error loading projects:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);

        if(error.status === 401 || error.status === 403){
          alert('Access denied. Token may be invalid or expired');
          localStorage.removeItem('token');
          this.router.navigateByUrl('/login');
        } else {
          this.error = 'Failed to load projects';
        }

        this.isLoadingProjects = false;
        this.cdr.detectChanges();
        
        
        
      }
    })

  }

  getanyLoading(): boolean {
    return this.isLoadingProjects
  }

  trackBy = (index: number, item: any): any => {
    return item.projectID || item.id || index;
  }


  createProject(){

  }

  editProject(projectID:number){}

  deleteProject(projectID: number){}

  archiveProject(projectID: number){}

  

}
