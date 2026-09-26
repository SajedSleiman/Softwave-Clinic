import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, LoginResponse } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  username: string = '';
  password: string = '';

  isLoading: boolean = false;
  errorMessage: string = '';

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Username and password are required.';
      return;
    }

    this.isLoading = true;

    this.authService.login(this.username, this.password)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: LoginResponse) => {
          console.log('[LoginComponent] login success, navigating to dashboard', response);
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          console.error('[LoginComponent] login error:', err);

          if (err.status === 401) {
            this.errorMessage = 'Invalid username or password.';
          } else if (err.status === 0) {
            this.errorMessage = 'Cannot connect to the server. Check your connection or API CORS settings.';
          } else {
            this.errorMessage = err.error?.message || 'Login failed. Please try again.';
          }
        }
      });
  }
}