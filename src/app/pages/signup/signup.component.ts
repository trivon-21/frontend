import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  form!: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    }, { validators: passwordsMatch });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password } = this.form.value;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.signup({ fullName, email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        localStorage.setItem('token', res.token);
        // TODO: navigate to dashboard once it exists
        console.log('Signup successful:', res.user);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message ?? 'Signup failed. Please try again.';
      },
    });
  }
}
