import { Component, Inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TaskDTO } from '../../interfaces/TaskDTO';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { Admin } from '../../services/admin';


@Component({
  selector: 'app-create-task-dialog',
  imports: [
    MatFormFieldModule,
    
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-task-dialog.html',
  styleUrl: './create-task-dialog.css',
})
export class CreateTaskDialog implements OnInit{
  title: string = '';
  description: string = '';
  priorityID: number = 0;
  priorityName: string = '';
  form: FormGroup;


  priorities = [
    { priorityID: 1, priorityName: 'Low' },
    { priorityID: 2, priorityName: 'Medium' },
    { priorityID: 3, priorityName: 'High' },
  ];


  users: any[] = [];
  isLoadingUsers = false;

  constructor(
    private dialogRef: MatDialogRef<CreateTaskDialog>,
    private formBuilder: FormBuilder,
    private adminService: Admin
  ){
    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      priorityID: [null, Validators.required],
      assignedTo: [null, Validators.required]
    })
  }
  


  ngOnInit(): void {
    this.loadUsers()
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next:(data: any)=>{
        console.log('👥 Users loaded:', data);

        // Filter just active users, not archived not deleted
        this.users = data.filter((user: any)=>!user.archived && !user.deleteAt && user.role.roleID == 3 );
        console.log('✅ Active users:', this.users);
        this.isLoadingUsers= false; 
      },
      error: (error)=>{
        console.error('❌ Error loading users:', error);
        alert('Failed to load users, Please try again.')
        this.isLoadingUsers = false;
      }
    })
  }



  submit(){
    if(this.form.valid){
      console.log('form value:', this.form.value);
      
      this.dialogRef.close(this.form.value);
    }
  }

  cancel(){
    this.dialogRef.close()
  }
}
