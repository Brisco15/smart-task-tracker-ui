import { Component, OnInit } from '@angular/core';
import { Admin } from '../../services/admin';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';



@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatCheckboxModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  users: any[] = [];
  //projects: any[] = [];
  anyLoading = false;
  error: string | null = null;
  displayedColumns: string[] = ['userID', 'userName', 'email', 'role', 'createdAt','actions'];
  
  get dataSource() {
    return this.users;
  }
  constructor(private adminService: Admin, private router: Router) { }

  ngOnInit(): void {

    const token = localStorage.getItem('token');
    if(!token){
      console.warn('No token found, redirecting to login');
      this.router.navigateByUrl('/login')
      return;
    }

    this.loadUsers();
    //this.loadProjects();
  }

  loadUsers() {
    this.anyLoading = true;
    this.error = null;
    console.log('🔄 Loading users...');
    
    this.adminService.getAllUsers().subscribe({
      next: (data: any) => {
        console.log('✅ Users loaded:', data);
        console.log('📊 Data type:', typeof data, 'Is array:', Array.isArray(data));
        
        if (Array.isArray(data)) {
          this.users = data;
        } else if (data && Array.isArray(data.users)) {
          this.users = data.users;
        } else {
          console.warn('⚠️ Unexpected data format:', data);
          this.users = [];
        }
        
        console.log('👥 Final users count:', this.users.length);
        if (this.users.length > 0) {
          console.log('🔍 First user:', this.users[0]);
        }
        
        this.anyLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        if(error.status === 401 || error.status === 403){
          alert('Access denied. you do not have permission')
          this.router.navigateByUrl('/login')
        }else{
          this.error = 'Failed to load users';
        }
        this.anyLoading = false;
      }
    });
  }

  // loadProjects() {
  //   //this.isLoading = true;
  //   this.error = null;
  //   this.adminService.getProjects().subscribe({
  //     next: (data: any) => {
  //       this.Usersprojects = data;
  //       //this.isLoading = false;
  //     },
  //     error: (error)=>{
  //       console.error('error loading projects', error);
  //       if(error.status === 401 || error.status === 403){
  //          alert('Access denied. you do not have permission')
  //       }else{
  //         this.error = 'Failed to load projects'
  //       }
  //       //this.isLoading = false;
  //       t: () => {
  //       this.loadUsers();

  //     },
  //     error: (error)=>{
  //       console.error('Error deleting user', error);
  //       if(error.status === 403){
  //         alert('You do not have permission to execute this action')
  //       } else {
  //         alert('Failed to delete user')
  //       }
        
  //     }
  //   })
  // }

  // deleteProject(projectID: number) {
  //   if(!confirm('Are you sure you want to delete this project?')) return;
  //   this.adminService.deleteProject(projectID).subscribe({
  //     next: () => {
  //       this.loadProjects();
  //     },
  //     error: (error)=>{
  //       console.error('Error deleting project', error);
  //       if(error.status === 403){
  //         alert('You do not have permission to execute this action')
  //       } else {
  //         alert('Failed to delete project')
  //       }
        
  //     }
  //   });
  // }

  deleteUser(userID: number){
    if(!confirm('are you sure you want to delete this user?')) return;
    this.adminService.deleteUser(userID).subscribe({
      next:()=>{
        this.loadUsers();
      },
      error: (error)=>{
        console.error('Error deleting user', error);
        if(error.status === 403){
          alert('You do not have permission to perform this action')
        }else{
          alert('Failed to delete the user')
        }
        
      }
    })
  }

  editUser(userID: number) {
    // Navigate to user edit page or open edit modal
    console.log('Edit user:', userID);
    // TODO: Implement user editing functionality
    alert('Edit user functionality not yet implemented');
  }

  archiveUser(userID: number){
    if(!confirm('are you sure you want to archive this user?')) return;


  }

  editProject(projectID: number) {
    // Navigate to project edit page or open edit modal
    console.log('Edit project:', projectID);
    // TODO: Implement project editing functionality
    alert('Edit project functionality not yet implemented');
  }

}
