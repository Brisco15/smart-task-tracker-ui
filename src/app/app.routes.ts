import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { roleGuardGuard } from './guards/role-guard-guard';
import { Users } from './pages/users/users';
import { Admin } from './pages/admin/admin';
import { Layout } from './pages/layout/layout';



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
        path: '',
        component: Layout,
        canActivate: [authGuard,roleGuardGuard],
        children: 
        [
            {
                path: 'dashboard',
                component: Dashboard,
                title: 'Dashboard',
                data: {roles: ['Admin', 'Developer', 'Manager']}
        
            },
            {
                path: 'admin',
                component: Admin,
                title: 'Admin',
                data: { roles: ['Admin']}
            },
            {
                path: 'users',
                component: Users,
                title: 'Users',
                data: { roles: ['Admin', 'Developer', 'Manager']}
            },
            {
                path: '**',
                redirectTo: 'login'
            }
    

        ]

    },
    

];
