import { Component, signal, computed, inject } from '@angular/core';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
   //Signals for form data
   email = signal('');
   passwordHash = signal('');

   //Signals for validation states
   emailTouched = signal(false);
   passwordTouched = signal(false);
   isSubmitting = signal(false);

   //Computed validation
   emailValid = computed(()=> {
     const emailValue = this.email();
     const emailRegex = /^[^@]+@[^@]+\.[^\s@]+$/;
     return emailRegex.test(emailValue);
   });

   passwordValid = computed(() => {
    return this.passwordHash().length >= 8;
   });

   formValid = computed(()=>{
    return this.emailValid() && this.passwordValid();
   });

   //Computed error message 

   showEmailError = computed(() => {
     return this.emailTouched() && !this.emailValid();

   });

   showPasswordError = computed(()=> {
    return this.passwordTouched() && !this.passwordValid();
   })


   // Inject services
   private router = inject(Router);
   private http = inject(HttpClient);
   private authService = inject(Auth);

   onEmailInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.email.set(value);
    this.emailTouched.set(true);
   }

   onPasswordInput(event: Event){
    const value = (event.target as HTMLInputElement).value;
    this.passwordHash.set(value);
    this.passwordTouched.set(true);
   }


  onLogin() {
    if(!this.formValid()) return;

    this.isSubmitting.set(true);

    this.authService.login(this.email(), this.passwordHash()).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response);
        console.log(this.email(), this.passwordHash());
        
        if (response.token) {
          localStorage.setItem('token', response.token);

          setTimeout(()=>{
            alert('Login successful!');
            this.router.navigateByUrl('/dashboard');
          }, 100);
        }else {
          alert('No token received from server')
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        alert('Invalid credentials. Please try again.');
        this.isSubmitting.set(false);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
