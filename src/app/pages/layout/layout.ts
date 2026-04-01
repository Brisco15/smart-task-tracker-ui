import { Component, inject } from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router'
import { Auth } from '../../services/auth';
import { authGuard } from '../../guards/auth-guard';
import { roleGuardGuard } from '../../guards/role-guard-guard';
import { Admin } from '../../services/admin';



@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {

  router = inject(Router);

  constructor(private authService: Auth, private adminService: Admin){}
}
