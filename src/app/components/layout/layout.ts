import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class LayoutComponent {
  constructor(protected api: ApiService, private router: Router) {
    // If not authenticated, send to login
    if (!this.api.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  getUserName(): string {
    const user = this.api.currentUser();
    if (!user) return 'Staff Member';
    return `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username;
  }

  handleLogout(): void {
    this.api.logout();
    this.router.navigate(['/login']);
  }
}
