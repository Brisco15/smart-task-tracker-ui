// smart-task-tracker-ui\src\app\pages\edit-user-dialog\edit-user-dialog.ts

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { UserDTO } from '../../interfaces/UserDTO';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './edit-user-dialog.html',
  styleUrls: ['./edit-user-dialog.css']
})
export class EditUserDialog implements OnInit {
  
  // User data copy (to avoid modifying original)
  userName: string = '';
  email: string = '';
  roleName: string = '';
  roleID: number = 0;

  availableRoles = [
    { roleID: 1, roleName: 'Admin' },
    { roleID: 2, roleName: 'Manager' },
    { roleID: 3, roleName: 'Developer' },

  ];

  constructor(
    public dialogRef: MatDialogRef<EditUserDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { user: UserDTO }
  ) {
    console.log('📝 EditUserDialog received data:', data);
  }

  ngOnInit(): void {
    // Initialize form with user data
    if (this.data && this.data.user) {
      this.userName = this.data.user.userName || '';
      this.email = this.data.user.email || '';
      this.roleName = this.data.user.role?.roleName || '';
      this.roleID = this.data.user.role?.roleID || 0;
      
      console.log('📋 Form initialized:', {
        userName: this.userName,
        email: this.email,
        roleName: this.roleName,
        roleID: this.roleID
      });
    } else {
      console.error('❌ No user data received in dialog!');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Create updated user object
    const updatedUser = {
      userID: this.data.user.userID,
      userName: this.userName,
      email: this.email,
      roleID: this.roleID,
      role: {
        roleID: this.roleID,
        roleName: this.availableRoles.find(r => r.roleID === this.roleID)?.roleName || this.roleName
      }
    };

    console.log('💾 Saving user:', updatedUser);
    this.dialogRef.close(updatedUser);
  }

  isFormValid(): boolean {
    return this.userName.trim() !== '' && 
           this.email.trim() !== '' && 
           this.roleID > 0;
  }
}