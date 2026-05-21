import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="glass-panel login-card">
        <div class="login-header">
          <h2>SFR RESTAURANT</h2>
          <p>Login to your POS terminal</p>
        </div>

        @if (errorMessage()) {
          <div class="login-error">
            {{ errorMessage() }}
          </div>
        }

        <form (submit)="handleLogin($event)">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input 
              type="text" 
              name="username" 
              [(ngModel)]="username" 
              class="input-control" 
              placeholder="Enter your username" 
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input 
              type="password" 
              name="password" 
              [(ngModel)]="password" 
              class="input-control" 
              placeholder="••••••••" 
              required
            />
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="isLoading()">
            {{ isLoading() ? 'Logging in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 40px 30px;
      animation: fadeInUp 0.5s ease-out;
    }
    .login-header {
      text-align: center;
      margin-bottom: 35px;
    }
    .login-header h2 {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 1.5px;
      background: linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .login-header p {
      color: var(--color-text-muted);
      font-size: 14px;
    }
    .login-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--color-danger);
      padding: 12px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 24px;
      text-align: center;
    }
    .w-full {
      width: 100%;
      margin-top: 10px;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
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
