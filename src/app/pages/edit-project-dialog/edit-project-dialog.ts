import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ProjectDTO } from "../../interfaces/ProjectDTO";

@Component({
  selector: 'app-edit-project-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatCheckboxModule,
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './edit-project-dialog.html',
  styleUrl: './edit-project-dialog.css',
})
export class EditProjectDialog implements OnInit{
  form!: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<EditProjectDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {project: ProjectDTO}
  ){
    // Initialize form early to prevent undefined access
    this.initializeForm();
  }

  ngOnInit(): void {
    // Form is already initialized in constructor
  }

  private initializeForm(): void {
    if (!this.data?.project) {
      console.error('No project data provided');
      this.dialogRef.close();
      return;
    }

    // Helper function to convert date string to Date object
    const parseDate = (dateInput: Date | string | null): Date | null => {
      if (!dateInput) return null;
      
      // If already a Date object, return it
      if (dateInput instanceof Date) {
        return dateInput;
      }
      
      // Parse string date
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Initialize form with project data
    this.form = this.formBuilder.group({
      projectName: [this.data.project.projectName || '', Validators.required],
      description: [this.data.project.description || '', [Validators.required, Validators.maxLength(500)]],
      startDate: [parseDate(this.data.project.startDate), Validators.required],
      endDate: [parseDate(this.data.project.endDate), Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.form.valid) {
      // Mark all fields as touched to show validation errors
      this.form.markAllAsTouched();
      return;
    }

    try {
      // Helper function to convert Date to YYYY-MM-DD format
      const formatDateOnly = (date: Date | null): string => {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
          throw new Error('Invalid date provided');
        }
        return date.toISOString().split('T')[0];
      };

      const formValue = this.form.value;
      const result: ProjectDTO = {
        projectID: this.data.project.projectID,
        projectName: formValue.projectName?.trim(),
        description: formValue.description?.trim(),
        startDate: new Date(formatDateOnly(formValue.startDate) + 'T00:00:00'),
        endDate: new Date(formatDateOnly(formValue.endDate) + 'T00:00:00'),
        // Keep original values for fields not being edited
        createdBy: this.data.project.createdBy,
        archived: this.data.project.archived,
        createdAt: this.data.project.createdAt,
        modifiedBy: this.data.project.modifiedBy
      };
      
      console.log('this is the form after submiting:', result)
      this.dialogRef.close(result);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please check your input and try again.');
    }
  }
}

