import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';


export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(Auth);


  if (!authService.isAuthenticated()) {
    router.navigateByUrl('/login');
    return false;
  }

  return true;
};
