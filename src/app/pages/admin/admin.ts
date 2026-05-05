import { Component, OnInit, ChangeDetectorRef, inject, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Admin as AdminService } from '../../services/admin';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { UserDTO } from '../../interfaces/UserDTO';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { EditUserDialog } from '../edit-user-dialog/edit-user-dialog';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-admin',
  imports: [CommonModule,MatPaginatorModule ,DatePipe, MatTableModule, MatButtonModule, MatCheckboxModule, ScrollingModule, MatDialogModule,],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {

  users: UserDTO[] = [];
  error: string | null = null;
  displayedColumns: string[] = ['userID', 'userName', 'email', 'role', 'createdAt','actions'];
  dataSource = new MatTableDataSource<UserDTO>([]);
  http = inject(HttpClient);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  isLoadingUsers = false;
  

  constructor(private adminService: AdminService, private router: Router,
    private cdr: ChangeDetectorRef, private dialog: MatDialog,
    private authService: Auth
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

 loadUsers() {
  this.isLoadingUsers = true;
  this.error = null;
  
  this.adminService.getAllUsers().subscribe({
    next: (data: any) => {     
      const activeUsers = data.filter((user: UserDTO) => !user.archived)
      this.users = activeUsers;
      
      //  DataSource reload
      this.dataSource.data = activeUsers;
      this.isLoadingUsers = false;
      //  Force Change Detection 
      this.cdr.detectChanges();
    },
    error: (error) => {
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

ngAfterViewInit():void{
  this.dataSource.paginator = this.paginator;
  setTimeout(()=>{
    if(this.paginator && this.dataSource.data.length > 0){
      this.dataSource.paginator = this.paginator;
    }
  }, 0)
}


ngOnDestroy(): void {}
 
getAnyLoading(): boolean {
  return this.isLoadingUsers;
}

trackBy = (index: number, item: any): any => {
    return item.userID || item.id || index;
}

deleteUser(userID: number){
    const currentUserID = this.authService.getCurrentUserID();
    if(currentUserID === userID){
      alert('You cannot delete yourself');
      return;
    }
    
   
    if(!confirm('are you sure you want to delete this user?')) return;
    this.adminService.deleteUser(userID).subscribe({
      next:()=>{
        this.loadUsers();
      },
      error: (error)=>{
        if(error.status === 403){
          alert('You do not have permission to perform this action')
        }else{
          alert('Failed to delete the user')
        } 
      }
    })
  }

  archiveUser(userID: number){
    const currentUserID = this.authService.getCurrentUserID();
    if(currentUserID === userID){
      alert('You cannot archive yourself');
      return;
    }

    if(!confirm('Are you sure you want to archive this user?')) return;
    
    this.adminService.archiveUser(userID).subscribe({
      next: (response: any) => {
        alert(response.message ||'User archived successfully');
        this.loadUsers(); 
      },
      error: (error) => {
        if (error.status === 403) {
          alert('You do not have permission to perform this action');
        } else {
          alert('Failed to archive user');
        }
      }
    });
  }

   editUser(userID: number) {
    const currentUserID = this.authService.getCurrentUserID();
    if(currentUserID === userID){
      alert('You cannot edit yourself');
      return;
    }
    const userToEdit = this.users.find(u => u.userID === userID);
    if(!userToEdit){
      alert('User not found');
      return;
    }

    // Open dialog with user data
    const dialogRef = this.dialog.open(EditUserDialog, {
      height: '500px',
      width: '600px',
      data: {user: userToEdit}
    });

    // Handle dialog close
    dialogRef.afterClosed().subscribe(result =>{
      if(result){
        
        //Update user via API
        this.adminService.updateUser(userID, result).subscribe({
          next: () => {
            alert('User updated successfully');
            this.loadUsers();
          },
          error: (error) => {
            alert('Failed to update user infos')
          }
        })
        
      }
    })  
  }
}
