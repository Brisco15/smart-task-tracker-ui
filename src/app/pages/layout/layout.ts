import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../services/auth';
import { authGuard } from '../../guards/auth-guard';
import { roleGuardGuard } from '../../guards/role-guard-guard';
import { Admin } from '../../services/admin';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';



@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
            MatToolbarModule, MatSidenavModule, MatButtonModule, MatIconModule,
            MatListModule, MatMenuModule, MatTooltipModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {

  router = inject(Router);
  sidenavOpened = true;
  currentUser: any = null;

  constructor(private authService: Auth, private adminService: Admin){
    this.loadUserInfo();
  }

  loadUserInfo() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUser = {
          name: payload.unique_name || payload.sub || 'User',
          role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User',
          email: payload.email || ''
        };
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  onLogout(){
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  getActiveRoute(): string {
    return this.router.url;
  }
}
