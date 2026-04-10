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
import { CreateProjectDialog } from '../create-project-dialog/create-project-dialog';
import { Auth } from '../../services/auth';



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
    private cdr : ChangeDetectorRef,
    private authService : Auth

  ){}

  ngOnInit(): void {
    
    this.loadProjects()
  }

  // Load projects from the backend
  loadProjects(){
    this.isLoadingProjects = true;
    this.error = null;
    // Call the service to get projects
    this.projectService.getAllProjects().subscribe({
      next: (data: any) =>{
        // Filter out archived projects
        const activeProjects = data.filter((project: ProjectDTO) => !project.archived)
        // Update the projects array and data source
        this.projects = activeProjects;
        // Update the data source for the table
        this.dataSource.data = activeProjects;
        // Set loading to false after data is loaded
        this.isLoadingProjects = false;
        // Trigger change detection to update the UI
        this.cdr.detectChanges();
      },
      error : (error) => {
        console.error('Error loading projects:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        // Handle authentication errors
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
  // Check if any loading is in progress
  getanyLoading(): boolean {
    return this.isLoadingProjects
  }
  // TrackBy function for ngFor to optimize rendering
  trackBy = (index: number, item: any): any => {
    return item.projectID || item.id || index;
  }


  createProject(){
    // Get role of the user that is trying to create a project
    const userRole = this.authService.getUserRole();
    console.log('current Role:', userRole)
    if(userRole !== 'Manager'){
      alert('You do not have permission to perform this action')
      return ;
    }
    const dialogRef = this.dialog.open(CreateProjectDialog, {
      height: '500px',
      width: '600px',
    });

    


    
  }

  editProject(projectID: number) { }

  // Delete a project with confirmation
  deleteProject(projectID: number) {
    // Show confirmation dialog before deleting
    if (!confirm('Are you sure you want to delete this project?')) return;
    // Call the service to delete the project
    this.projectService.deleteProject(projectID).subscribe({
      next:()=> {
        this.loadProjects();
      },
      // Handle errors during deletion
      error: (error)=>{
        console.error('Error deleting project:',error);
        if(error.status === 403){
          alert('You do not have permission to perform this action')
        }else{
          alert('Failed to delete the project')
        } 
      }
    })
  }

  archiveProject(projectID: number){}

  

}
