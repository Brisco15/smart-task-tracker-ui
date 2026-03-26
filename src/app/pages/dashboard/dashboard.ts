import { Component, OnInit } from '@angular/core';
import { Admin } from '../../services/admin';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  users: any[] = [];
  projects: any[] = [];
  isLoading = false;
  error: string | null = null;
  displayedColumns: string[] = ['id', 'name', 'email', 'role', 'actions'];
  dataSource = this.users;
  constructor(private adminService: Admin, private router: Router) { }

  ngOnInit(): void {

    const token = localStorage.getItem('token');
    if(!token){
      console.warn('No token found, redirecting to login');
      this.router.navigateByUrl('/login')
      return;
    }

    this.loadUsers();
    this.loadProjects();
  }

  loadUsers() {
    this.isLoading = true;
    this.error = null;
    this.adminService.getAllUsers().subscribe({
      next: (data: any) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        if(error.status === 401 || error.status === 403){
          alert('Access denied. you do not have permission')
          this.router.navigateByUrl('/login')
        }else{
          this.error = 'Failed to load users';
        }
        this.isLoading = false
      }
    });
  }

  loadProjects() {
    this.isLoading = true;
    this.error = null;
    this.adminService.getProjects().subscribe({
      next: (data: any) => {
        this.projects = data;
        this.isLoading = false;
      },
      error: (error)=>{
        console.error('error loading projects', error);
        if(error.status === 401 || error.status === 403){
           alert('Access denied. you do not have permission')
        }else{
          this.error = 'Failed to load projects'
        }
        this.isLoading = false;
        
      }
    });
  }

  deleteUser(userID: number) {
    if(!confirm('Are you sure you want to delete this user?')) return;
    this.adminService.deleteUser(userID).subscribe({
      next: () => {
        this.loadUsers();

      },
      error: (error)=>{
        console.error('Error deleting user', error);
        if(error.status === 403){
          alert('You do not have permission to execute this action')
        } else {
          alert('Failed to delete user')
        }
        
      }
    });
  }

  deleteProject(projectID: number) {
    if(!confirm('Are you sure you want to delete this project?')) return;
    this.adminService.deleteProject(projectID).subscribe({
      next: () => {
        this.loadProjects();
      },
      error: (error)=>{
        console.error('Error deleting project', error);
        if(error.status === 403){
          alert('You do not have permission to execute this action')
        } else {
          alert('Failed to delete project')
        }
        
      }
    });
  }

  editUser(userID: number) {
    // Navigate to user edit page or open edit modal
    console.log('Edit user:', userID);
    // TODO: Implement user editing functionality
    alert('Edit user functionality not yet implemented');
  }

  editProject(projectID: number) {
    // Navigate to project edit page or open edit modal
    console.log('Edit project:', projectID);
    // TODO: Implement project editing functionality
    alert('Edit project functionality not yet implemented');
  }

}
