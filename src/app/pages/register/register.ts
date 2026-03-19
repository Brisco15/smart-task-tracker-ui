import { Component, inject } from '@angular/core';
import { Auth } from '../../services/auth';
import { HttpClient } from '@angular/common/http';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Router, RouterModule, RouterLinkActive} from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLinkActive,
    RouterModule,
    CommonModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  router = inject(Router);
  http = inject(HttpClient);
  public registerForm: FormGroup;
  public roles: { roleID: number; roleName: string}[]= [];
  public apiRoleUrl = 'http://localhost:5260/api/Roles';

  constructor(
    private formBuilder: FormBuilder,
    private authService: Auth,
  ){
    this.registerForm = this.formBuilder.group({
      userName: 
      [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern('^[a-zA-ZäöüÄÖÜß][a-zA-Z0-9 äöüÄÖÜß .-]*$')
        ]
      ],
      email:
      [
        '',
        [
          Validators.email,
          Validators.required,
          Validators.pattern(/^[^@]+@[^@]+\.[^\s@]+$/),
        ]
      ],
      passwordHash:
      [
        '',
        [
          Validators.required,
          Validators.pattern('^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[!#$%&?]).{8,}$')
        ]
      ],
      roleID: 
      [
        null,
        Validators.required
      ],
    });
    this.fetchRoles();
  }

  //Get roles from API
  fetchRoles() {
    this.http.get<{ roleID: number; roleName: string }[]>(this.apiRoleUrl).subscribe({
      next: (roles: { roleID: number; roleName: string }[]) => {
        this.roles = roles;
      },
      error : (error: any) => {
        console.error('Error fetching roles:', error);
      }
  });
  }

  public onRegister(): void {
    if(this.registerForm.valid){
      const { userName, email, passwordHash, roleID } = this.registerForm.value;

      const roleIdNumber = Number(roleID);
      console.log("Sending registration data:", {
        userName,
        email,
        roleID: roleIdNumber,
        roleIDType: typeof roleIdNumber
      });

      this.authService
      .register(userName, email,passwordHash, roleIdNumber)
      .subscribe({
        next: (response: any)=>{
          console.log("Registration successful:", response)
          alert('User was successfully registered');
          this.router.navigateByUrl('/login');
        },
        error: (err: any) => {
          console.error('Registration error:', err);
          alert('An error occurred during registration. Please try again.'); 
        }
      })
    }
  }


}
