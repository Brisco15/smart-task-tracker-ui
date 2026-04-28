import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { NgIf, NgForOf } from "../../../../node_modules/@angular/common/types/_common_module-chunk";
import { Admin } from '../../services/admin';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { Auth } from '../../services/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-edit-task-dialog',
  imports: [
    MatFormFieldModule,
    FormsModule, 
    NgIf,
    NgForOf, 
    CommonModule, 
    MatButtonModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule
       
  ],
  templateUrl: './edit-task-dialog.html',
  styleUrl: './edit-task-dialog.css',
})
export class EditTaskDialog implements OnInit{
  form: FormGroup;
  http = inject(HttpClient);
  priorities: { priorityID: number; priorityName: string}[] = [];
  statuses: { statusID: number; statusName: string}[] = [];
  apiStatusUrl = 'http://localhost:5260/api/Status';
  apiPriorityUrl = 'http://localhost:5260/api/Priorities';

  constructor(
    private formBuilder: FormBuilder,
    private adminService: Admin,
    private authService: Auth,

  ){
    this.form = this.formBuilder.group({

    });
    this.loadPriorities();
    this.loadStatuses
  }

  // Load priorities from the API
  loadPriorities(){
    this.http.get<{ priorityID: number; priorityName: string}[]>(this.apiPriorityUrl).subscribe({
      next: (priorities : { priorityID: number; priorityName: string}[] )=> {
        this.priorities = priorities;
      },
      error: (error: any) => {
        console.error('Error loading priorities');
        
      }
    })
  }
  // load statuses from the API
  loadStatuses(){
    this.http.get<{ statusID: number; statusName: string}[]>(this.apiStatusUrl).subscribe({
      next: ( statuses : { statusID: number; statusName: string}[]) => {
        this.statuses = statuses;
      },
      error: (error: any) => {
        console.error(' error loading statuses:', error);
        
      }
    })

  }

  ngOnInit(): void {
    
  }
}
