import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';



@Component({
  selector: 'app-create-project-dialog',
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
  templateUrl: './create-project-dialog.html',
  styleUrl: './create-project-dialog.css',
})
export class CreateProjectDialog {
  form: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CreateProjectDialog>
  ){
    this.form = this.formBuilder.group({
      projectName: ['', Validators.required ],
      description: ['', Validators.required, ],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
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


