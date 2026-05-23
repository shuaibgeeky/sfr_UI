import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
 styleUrls: ['./login.css']
})
export class LoginComponent {
  username = '';
  password = '';
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(private api: ApiService, private router: Router) {
    // If already authenticated, redirect to billing immediately
    if (this.api.isAuthenticated()) {
      this.router.navigate(['/billing']);
    }
  }

  async handleLogin(event: Event) {
    event.preventDefault();
    if (!this.username || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.api.login({
        username: this.username,
        password: this.password
      });
      this.router.navigate(['/billing']);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Invalid credentials');
    } finally {
      this.isLoading.set(false);
    }
  }
}
