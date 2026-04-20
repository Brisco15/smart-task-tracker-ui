import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
  imports: [CommonModule, MatTableModule, MatButtonModule, MatCheckbox, MatDialogModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements OnInit {
  projects: ProjectDTO[] = [];
  error: string | null = null;
  dataSource = new MatTableDataSource<ProjectDTO>([]);
  displayedColumns: string[] = ['projectID', 'projectName', 'description', 'startDate', 'endDate','createdBy', 'actions'];
  http = inject(HttpClient);
  router = inject(Router);
  isLoadingProjects = false;

  constructor(
    private projectService: ProjectService,
    private dialog: MatDialog,
    private authService: Auth,
    private cdr: ChangeDetectorRef 
  ){}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(){
    this.isLoadingProjects = true;
    this.error = null;
    
    this.projectService.getAllProjects().subscribe({
      next: (data: any) => {
        console.log('📥 Projects loaded:', data);
        
        const activeProjects = data.filter((project: ProjectDTO) => !project.archived);
        
        // ✅ Neue DataSource Instanz erstellen statt nur data zu setzen
        this.projects = activeProjects;
        this.dataSource = new MatTableDataSource<ProjectDTO>(activeProjects);
        this.isLoadingProjects = false;
        
        // ✅ markForCheck() statt detectChanges()
        this.cdr.markForCheck();
        
        console.log('✅ DataSource updated, count:', this.dataSource.data.length);
      },
      error: (error) => {
        console.error('❌ Error loading projects:', error);
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
            
            setTimeout(() => {
              this.loadProjects();
            }, 0);
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

            const projectIndex = this.projects.findIndex(p=>p.projectID === projectID);
            if(projectIndex !== -1){
              this.projects[projectIndex]= {
                ...this.projects[projectIndex],
                projectName: result.projectName,
                description: result.description,
                startDate: result.startDate,
                endDate: result.endDate
              };

              this.dataSource = new MatTableDataSource<ProjectDTO>(this.projects);
              this.cdr.markForCheck();
            }
            
            setTimeout(() => {
              this.loadProjects();
            }, 100);   
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
        
        setTimeout(() => {
          this.loadProjects();
        }, 0);
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
        
        setTimeout(() => {
          this.loadProjects();
        }, 0);
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
}
