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
  showDebugPanel = false;  // Add debug panel toggle
  @ViewChild(MatPaginator) paginator!: MatPaginator;

 
  constructor(
    private projectService: ProjectService,
    private dialog: MatDialog,
    private authService: Auth,
    private cdr: ChangeDetectorRef 
  ){}

  ngOnInit(): void {
    console.log('🔄 Component initialized');
    // Validate token before loading
    this.validateAndLoadProjects();
  }

  private validateAndLoadProjects(): void {
    const token = localStorage.getItem('token');
    console.log('🔍 Token check:', !!token);
    
    if (!token) {
      console.log('❌ No token found, redirecting to login');
      this.router.navigateByUrl('/login');
      return;
    }
    
    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = Date.now() >= payload.exp * 1000;
      if (isExpired) {
        console.log('❌ Token expired, redirecting to login');
        localStorage.removeItem('token');
        this.router.navigateByUrl('/login');
        return;
      }
    } catch (e) {
      console.log('❌ Invalid token format, redirecting to login');
      localStorage.removeItem('token');
      this.router.navigateByUrl('/login');
      return;
    }
    
    this.loadProjects();
  }

  ngAfterViewInit(): void{
    // Paginator verbinden
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
    console.log('🔄 Component destroyed');
  }
  
  // Force refresh method
  forceRefresh(): void {
    console.log('🔄 Force refresh triggered');
    this.error = null;
    this.projects = [];
    this.dataSource.data = [];
    this.validateAndLoadProjects();
  }

  loadProjects(){
    console.log('🔄 loadProjects() called');
    this.isLoadingProjects = true;
    this.error = null;  // Always reset error state
    
    console.log('🔄 Starting to load projects...');
    
    this.projectService.getAllProjects().subscribe({
      next: (data: any) => {
        console.log('📥 Raw data received:', data);
        console.log('📊 Data type:', typeof data);
        console.log('📊 Is Array:', Array.isArray(data));
        
        const activeProjects = data.filter((project: ProjectDTO) => !project.archived);
        console.log('✅ Active projects after filter:', activeProjects);
        console.log('✅ Active projects count:', activeProjects.length);
        
        this.projects = activeProjects;
        this.dataSource.data = activeProjects;
        
        // Paginator nach Datenaktualisierung neu setzen
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
          console.log('✅ Paginator re-connected');
        }
        
        this.isLoadingProjects = false;
        this.cdr.markForCheck();  // Force change detection
        
        console.log('✅ Final state - DataSource.data.length:', this.dataSource.data.length);
        console.log('✅ Final state - isLoadingProjects:', this.isLoadingProjects);
        console.log('✅ Final state - error:', this.error);
        console.log('✅ Final state - Should show table?', !this.isLoadingProjects && this.dataSource.data.length > 0);
      },
      error: (error) => {
        console.error('❌ Error loading projects:', error);
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
    console.log('current Role:', userRole);
    
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
        
        console.log('📤 Sending project to backend:', newProject);

        this.projectService.postProject(newProject).subscribe({
          next: (response: any) => {
            console.log('✅ Project created successfully:', response);
            alert('Project created successfully!');
            
            this.loadProjects();
          },
          error: (error: any) => {
            console.error('❌ Error creating project:', error);
            console.error('Error status:', error.status);
            console.error('Error response:', error.error);
  
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
    const projectToEdit = this.projects.find(p => p.projectID === projectID);
    if(!projectToEdit){
      alert('Project not found');
      return;
    }

    const dialogRef = this.dialog.open(EditProjectDialog, {
      height: '500px',
      width: '600px',
      data: { project: projectToEdit }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        console.log('Dialog result:', result);
        
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

        console.log('📤 Sending update to backend:', updatedProject);

        this.projectService.updateProject(projectID, updatedProject).subscribe({
          next: () => {
            console.log('✅ Project updated successfully');
            alert('Project updated successfully');

            this.loadProjects();
          },
          error: (error) => {
            console.error('❌ Error updating project:', error);
            console.error('Error status:', error.status);
            console.error('Error details:', error.error);
          
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
        console.error('Error deleting project:', error);
        if(error.status === 403){
          alert('You do not have permission to perform this action');
        } else {
          alert('Failed to delete the project');
        } 
      }
    });
  }

  archiveProject(projectID: number){
    if(!confirm('Are you sure you want to archive this project?')) return;
    
    console.log('Archiving project:', projectID);

    this.projectService.archiveProject(projectID).subscribe({
      next: (response: any) => {
        console.log('✅ Project archived successfully:', response);
        alert('Project archived successfully');
        
        this.loadProjects();
      },
      error: (error) => {
        console.error('Error archiving project:', error);
        if (error.status === 403) {
          alert('You do not have permission to perform this action');
        } else {
          alert('Failed to archive project');
        }
      }
    });
  }
  
  // Helper method for debugging
  getDebugInfo(): any {
    const token = localStorage.getItem('token');
    return {
      hasToken: !!token,
      projectsCount: this.projects.length,
      dataSourceCount: this.dataSource.data.length,
      isLoading: this.isLoadingProjects,
      error: this.error,
      showTable: !this.isLoadingProjects && this.dataSource.data.length > 0,
      hasPaginator: !!this.paginator
    };
  }
}
