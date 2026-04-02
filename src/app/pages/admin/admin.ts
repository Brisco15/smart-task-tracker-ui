import { Component, OnInit, ChangeDetectorRef, inject} from '@angular/core';
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

@Component({
  selector: 'app-admin',
  imports: [CommonModule, DatePipe, MatTableModule, MatButtonModule, MatCheckboxModule, ScrollingModule, MatDialogModule,],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit{

  users: UserDTO[] = [];
  error: string | null = null;
  displayedColumns: string[] = ['userID', 'userName', 'email', 'role', 'createdAt','actions'];
  dataSource = new MatTableDataSource<UserDTO>([]);
  http = inject(HttpClient);
  
  isLoadingUsers = false;
  
   get anyLoading(): boolean {
   return this.isLoadingUsers 
 }
  trackBy = (index: number, item: any): any => {
    return item.userID || item.id || index;
  }

  constructor(private adminService: AdminService, private router: Router,
    private cdr: ChangeDetectorRef, private dialog: MatDialog
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

      const activeUsers = data.filter((user: UserDTO) => !user.archived)
      this.users = activeUsers;
      
      //  DataSource aktualisieren
      this.dataSource.data = activeUsers;
      
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


  archiveUser(userID: number){
    if(!confirm('Are you sure you want to archive this user?')) return;
    
    console.log('Archiving user:', userID);

    this.adminService.archiveUser(userID).subscribe({
      next: (response: any) => {
        alert(response.message ||'User archived successfully');
        this.loadUsers(); // Refresh the list
      },
      error: (error) => {
        console.error('Error archiving user', error);
        if (error.status === 403) {
          alert('You do not have permission to perform this action');
        } else {
          alert('Failed to archive user');
        }
      }
    });
  }


   editUser(userID: number) {
    // Find the user to edit
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
        console.log('Dialog result:', result);

        //Update user via API
        this.adminService.updateUser(userID, result).subscribe({
          next: () => {
            alert('User updated successfully');
            this.loadUsers();
          },
          error: (error) =>{
            console.error('Error updating user:', error);
            alert('Failed to update user infos')
          }
        })
        
      }
    })  
  }
  

}
