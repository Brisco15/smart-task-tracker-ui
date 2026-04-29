import { Component, OnInit, inject, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { Admin } from '../../services/admin';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PriorityService } from '../../services/priority-service';
import { StatusService } from '../../services/status-service';
import { HttpClient } from '@angular/common/http';
import { TaskDTO } from '../../interfaces/TaskDTO';

@Component({
  selector: 'app-edit-task-dialog',
  imports: [
    MatFormFieldModule,
    FormsModule,  
    CommonModule, 
    MatButtonModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatFormField,
    MatInputModule,
  ],
  templateUrl: './edit-task-dialog.html',
  styleUrl: './edit-task-dialog.css',
})
export class EditTaskDialog implements OnInit{
  form!: FormGroup;
  http = inject(HttpClient);
  priorities: { priorityID: number; priorityName: string}[] = [];
  statuses: { statusID: number; statusName: string}[] = [];
  users: any[] = [];
  isLoadingUsers = false;
  isLoadingPriorities = false;
  isLoadingStatuses = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private adminService: Admin,
    private priorityService: PriorityService,
    private statusService: StatusService,
    private dialogRef: MatDialogRef<EditTaskDialog>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: {task: TaskDTO}
  ){
    this.initializeForm();
  }

  private initializeForm(): void {
    if(!this.data?.task){
      console.error('No task data provided');
      this.dialogRef.close();
      return;
    }

    this.form = this.formBuilder.group({
      title: [this.data.task.title || '', Validators.required],
      description: [this.data.task.description || '', [Validators.required, Validators.maxLength(500)]],
      assignedTo: [this.data.task.assignedTo || 0, Validators.required],
      statusID: [this.data.task.statusID || 0, Validators.required],
      priorityID: [this.data.task.priorityID || 0, Validators.required],
    })
  }

  // Load priorities from the API
  loadPriorities(): void{
    this.isLoadingPriorities = true;
    this.priorityService.getAllPriorities().subscribe({
      next: (data: any) => {
        console.log('Priorities loaded:', data);
        this.priorities = data;
        this.isLoadingPriorities = false;
        this.cdr.detectChanges();  // ✅ Manuell Change Detection triggern
      },
      error: (error: any) => {
        console.error('Error loading priorities:', error);
        this.isLoadingPriorities = false;
        this.cdr.detectChanges();  // ✅ Manuell Change Detection triggern
      }
    });
  }

  // Load statuses from the API
  loadStatuses(): void{
    this.isLoadingStatuses = true;
    this.statusService.getAllStatus().subscribe({
      next: (data: any) => {
        console.log('Statuses loaded:', data);
        this.statuses = data;
        this.isLoadingStatuses = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading statuses:', error);
        this.isLoadingStatuses = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Load users from the API
  loadUsers(): void{
    this.isLoadingUsers = true;
    this.adminService.getAllUsers().subscribe({
      next: (data: any) => {
        console.log('👥 Users loaded:', data);
        this.users = data.filter((user: any) => 
          !user.archived && !user.deletedAt && user.role.roleID === 3
        );
        console.log('✅ Active users:', this.users);
        this.isLoadingUsers = false;
        this.cdr.detectChanges(); 
      },
      error: (error) => {
        console.error('❌ Error loading users:', error);
        alert('Failed to load users. Please try again.');
        this.isLoadingUsers = false;
        this.cdr.detectChanges();  
      }
    });
  }

  ngOnInit(): void {
    this.loadPriorities();
    this.loadStatuses();
    this.loadUsers();
  }

  onCancel(): void{
    this.dialogRef.close();
  }

  onSave(): void{
    if(!this.form.valid){
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const result: TaskDTO = {
      taskID: this.data.task.taskID,
      projectID: this.data.task.projectID,
      title: formValue.title,
      description: formValue.description,
      assignedTo: formValue.assignedTo,
      statusID: formValue.statusID,
      priorityID: formValue.priorityID,
      createdAt: this.data.task.createdAt,
      createdBy: this.data.task.createdBy,
      archived: this.data.task.archived
    };

    console.log('this is the form after submitting:', result);
    this.dialogRef.close(result);
  }
}
