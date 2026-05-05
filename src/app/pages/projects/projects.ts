import { ChangeDetectorRef, Component, inject, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { ProjectDTO } from '../../interfaces/ProjectDTO';
import { HttpClient } from '@angular/common/http';
import { MatCheckbox } from '@angular/material/checkbox';
import { ProjectService } from '../../services/project-service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateProjectDialog } from '../create-project-dialog/create-project-dialog';
import { EditProjectDialog } from '../edit-project-dialog/edit-project-dialog';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, MatPaginator,MatPaginatorModule, MatTableModule, MatButtonModule, MatCheckbox, MatDialogModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements OnInit, AfterViewInit, OnDestroy {

  projects: ProjectDTO[] = [];
  error: string | null = null;
  dataSource = new MatTableDataSource<ProjectDTO>([]);
  displayedColumns: string[] = ['projectID', 'projectName', 'description', 'startDate', 'endDate','createdBy', 'actions'];
  http = inject(HttpClient);
  router = inject(Router);
  isLoadingProjects = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

 
  constructor(
    private projectService: ProjectService,
    private dialog: MatDialog,
    private authService: Auth,
    private cdr: ChangeDetectorRef 
  ){}

  ngOnInit(): void {
    // Validate token before loading
    this.validateAndLoadProjects();
  }

  private validateAndLoadProjects(): void {
    const token = localStorage.getItem('token');
    
    if (!token) {
      this.router.navigateByUrl('/login');
      return;
    }
    
    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = Date.now() >= payload.exp * 1000;
      if (isExpired) {
        localStorage.removeItem('token');
        this.router.navigateByUrl('/login');
        return;
      }
    } catch (e) {
      localStorage.removeItem('token');
      this.router.navigateByUrl('/login');
      return;
    }
    
    this.loadProjects();
  }

  ngAfterViewInit(): void{
    // Connect Paginator
    this.dataSource.paginator = this.paginator;  
    // Force reconnect paginator after view init
    setTimeout(() => {
      if (this.paginator && this.dataSource.data.length > 0) {
        this.dataSource.paginator = this.paginator;
      }
    }, 0);
  }
  
  ngOnDestroy(): void {
  }
  
  loadProjects(){
    
    this.isLoadingProjects = true;
    this.error = null;  // Always reset error state
    this.projectService.getAllProjects().subscribe({
      next: (data: any) => {
        const activeProjects = data.filter((project: ProjectDTO) => !project.archived);
        this.projects = activeProjects;
        this.dataSource.data = activeProjects;
        
        // Paginator nach Datenaktualisierung neu setzen
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        
        this.isLoadingProjects = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        if(error.status === 401 || error.status === 403){
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          this.router.navigateByUrl('/login');
        } else if (error.status === 0) {
          this.error = 'Network error. Please check your connection and try again.';
        } else {
          this.error = `Failed to load projects (Error: ${error.status || 'Unknown'})`;
        }
        this.isLoadingProjects = false;
        this.cdr.markForCheck();
      }
    });
  }

  getAnyLoading(): boolean {
    return this.isLoadingProjects;
  }

  trackBy = (index: number, item: any): any => {
    return item.projectID || item.id || index;
  }

  createProject(){
    const userRole = this.authService.getUserRole();
    
    if(userRole !== 'Manager'){
      alert('You do not have permission to perform this action');
      return;
    }
    
    const dialogRef = this.dialog.open(CreateProjectDialog, {
      height: '500px',
      width: '400px',
      
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        const projectExists = this.projects.some(p => p.projectName === result.projectName);
        if(projectExists){
          alert('There is already a project with this name');
          return;
        }

        const currentUserID = this.authService.getCurrentUserID();

        const formatDateOnly = (date: Date): string => {
          return date.toISOString().split('T')[0];
        };

        const newProject = {
          projectName: result.projectName,
          description: result.description,
          startDate: formatDateOnly(result.startDate),
          endDate: formatDateOnly(result.endDate),
          createdBy: currentUserID
        };
        

        this.projectService.postProject(newProject).subscribe({
          next: () => {
            alert('Project created successfully!');
            this.loadProjects();
          },
          error: (error: any) => {
            if (error.status === 400) {
              alert(`Failed to create project: ${error.error?.message || error.error || 'Bad Request'}`);
            } else if (error.status === 409) {
              alert('A project with this name already exists');
            } else if (error.status === 403) {
              alert('You do not have permission to create projects');
            } else {
              alert('Failed to create project. Please try again.');
            }
          }
        });
      }
    });
  }

  editProject(projectID: number) {
    const userRole = this.authService.getUserRole();
    if(userRole !== 'Manager'){
      alert('You do not have permission to perform this action');
      return;
    }
    const projectToEdit = this.projects.find(p => p.projectID === projectID);
    if(!projectToEdit){
      alert('Project not found');
      return;
    }

    const dialogRef = this.dialog.open(EditProjectDialog, {
      
      width: '600px',
      data: { project: projectToEdit }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        const formatDateOnly = (date: Date | string | null): string | null => {
          if (!date) return null;
          if (typeof date === 'string') return date;
          return date.toISOString().split('T')[0];
        };
        
        const updatedProject = {
          projectName: result.projectName,
          description: result.description,
          startDate: formatDateOnly(result.startDate),
          endDate: formatDateOnly(result.endDate)
        };
        this.projectService.updateProject(projectID, updatedProject).subscribe({
          next: () => {
            alert('Project updated successfully');
            this.loadProjects();
          },
          error: (error) => {
            if (error.status === 403) {
              alert('You do not have permission to edit this project');
            } else if(error.status === 409){
              alert('A project with this name already exists');
            } else if (error.status === 500){
              alert('Server error. Please check the backend logs');
            } else {
              alert('Failed to update project');
            }
          }
        });
      }
    });
  }

  deleteProject(projectID: number) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    this.projectService.deleteProject(projectID).subscribe({
      next: () => {
        alert('Project deleted successfully');
        this.loadProjects();
      },
      error: (error) => {
        if(error.status === 403){
          alert('You do not have permission to perform this action');
        } else {
          alert('Failed to delete the project');
        } 
      }
    });
  }

  archiveProject(projectID: number){
    
    const userRole = this.authService.getUserRole();
    if(userRole === 'Developer'){
      alert('You do not have permission to perform this action');
      return;
    }

    if(!confirm('Are you sure you want to archive this project?')) return;
    this.projectService.archiveProject(projectID).subscribe({
      next: () => {
        alert('Project archived successfully');
        this.loadProjects();
      },
      error: (error) => {
        if (error.status === 403) {
          alert('You do not have permission to perform this action');
        } else {
          alert('Failed to archive project');
        }
      }
    });
  }

  // Go to Task Method
  goToTasks(projectID: number){
    this.router.navigate(['/projects', projectID, 'tasks']);
  }
  
}
