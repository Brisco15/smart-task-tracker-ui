import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const roleGuardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(Auth);

  //check if authenticated
  if(!authService.isAuthenticated()){
    router.navigateByUrl('/login');
    return false;
  }

  //Get required roles from route data
  const requiredRoles = route.data['roles'] as string[];
  
  if(!requiredRoles || requiredRoles.length === 0){
    return true;
  }

  //Get user's role
  const userRole = authService.getUserRole();

  if(!userRole || !requiredRoles.includes(userRole)){ 
    alert('Access Denied: Insufficient permissions');
    router.navigateByUrl('/dashboard');
    return false;
  }
  
  return true;
};
