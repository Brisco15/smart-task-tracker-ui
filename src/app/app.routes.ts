import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { roleGuardGuard } from './guards/role-guard-guard';
import { Users } from './pages/users/users';
import { Admin } from './pages/admin/admin';



export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'register',
        component: Register
    },
    {
        path: 'dashboard',
        component: Dashboard,
        title: 'Dashboard',
        canActivate: [authGuard]
    },
    {
        path: 'admin',
        component: Admin,
        title: 'Admin',
        canActivate: [authGuard, roleGuardGuard],
        data: { roles: ['1']}
    },
    {
        path: 'users',
        component: Users,
        title: 'Users',
        canActivate: [authGuard, roleGuardGuard],
        data: { roles: ['1', '2']}
    },
    {
        path: '**',
        redirectTo: 'login'
    }
    

];
