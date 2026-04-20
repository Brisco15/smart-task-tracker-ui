import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { roleGuardGuard } from './guards/role-guard-guard';
import { AdminComponent } from './pages/admin/admin';
import { Layout } from './pages/layout/layout';
import { Projects } from './pages/projects/projects';
import { Tasks } from './pages/tasks/tasks';




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
                component: AdminComponent,
                title: 'Admin',
                canActivate: [roleGuardGuard],
                data: { roles: ['Admin']}
            },
            {
                path: 'projects',
                component: Projects,
                title: 'Projects',
                canActivate: [roleGuardGuard],
                data: { roles: ['Admin', 'Developer', 'Manager']}
            },
            {
                path: 'tasks',
                component: Tasks,
                title: 'Tasks',
                canActivate: [roleGuardGuard],
                data: { roles: ['Admin', 'Developer', 'Manager']}
            },
            {
                path: '**',
                redirectTo: 'login'
            }
    

        ]

    },
    

];
