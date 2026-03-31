import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { Admin } from '../../services/admin';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { UserDTO } from '../../interfaces/UserDTO';

import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {ScrollingModule} from '@angular/cdk/scrolling';




@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DatePipe, MatTableModule, MatButtonModule, MatCheckboxModule, ScrollingModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  users: UserDTO[] = [];
  error: string | null = null;
  displayedColumns: string[] = ['userID', 'userName', 'email', 'role', 'createdAt','actions'];
  dataSource = new MatTableDataSource<UserDTO>([]);
  
  isLoadingUsers = false;
   get anyLoading(): boolean {
   return this.isLoadingUsers 
 }
  trackBy = (index: number, item: any): any => {
    return item.userID || item.id || index;
  }

  constructor(private adminService: Admin, private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    const token = localStorage.getItem('token');
    if(!token){
      console.warn('No token found, redirecting to login');
      this.router.navigateByUrl('/login')
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      } catch (e) { 
        localStorage.removeItem('token');
        this.router.navigateByUrl('/login');
        return;
      }
      this.loadUsers();
  }

 loadUsers() {
  this.isLoadingUsers = true;
  this.error = null;
  
  console.log('📥 Calling getAllUsers()...');
  
  this.adminService.getAllUsers().subscribe({
    next: (data: any) => {
      console.log('✅ Users loaded:', data);
      this.users = data;
      
      //  DataSource aktualisieren
      this.dataSource.data = data;
      
      this.isLoadingUsers = false;
      
      //  Change Detection manuell auslösen
      this.cdr.detectChanges();
      
      console.log('📊 DataSource updated, count:', this.dataSource.data.length);
    },
    error: (error) => {
      console.error('Error loading users:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      
      if(error.status === 401 || error.status === 403){
        alert('Access denied. Token may be invalid or expired.');
        localStorage.removeItem('token');
        this.router.navigateByUrl('/login');
      } else {
        this.error = 'Failed to load users';
      }
      this.isLoadingUsers = false;
      this.cdr.detectChanges();
    }
  });
}

 

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
    if(!confirm('Are you sure you want to archive this user?')) return;
    
    console.log('Archiving user:', userID);

    this.adminService.archiveUser(userID).subscribe({
      next: () => {
        this.loadUsers(); // Refresh the list
      },
      error: (error) => {
        console.error('Error archiving user', error);
        alert('Failed to archive user');
      }
    });
    
    // For now, just show a message
    alert('Archive functionality not implemented yet');
  }



}
