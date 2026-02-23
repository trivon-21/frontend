import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

function strongPassword(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value || '';
  const errors: ValidationErrors = {};
  if (v.length < 8) errors['minLength'] = true;
  if (!/[A-Z]/.test(v)) errors['uppercase'] = true;
  if (!/[a-z]/.test(v)) errors['lowercase'] = true;
  if (!/[0-9]/.test(v)) errors['number'] = true;
  if (!/[^A-Za-z0-9]/.test(v)) errors['specialChar'] = true;
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  showPassword = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  isTokenInvalid = false;
  token = '';
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, strongPassword]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatch }
    );
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  get pw() {
    return this.form.get('password')?.value as string || '';
  }

  get pwErrors() {
    return this.form.get('password')?.errors || {};
  }

  get passwordTouched() {
    return this.form.get('password')?.touched ?? false;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.form.value.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message;
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.isLoading = false;
        const msg: string = err.error?.message ?? '';
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
          this.isTokenInvalid = true;
        } else {
          this.errorMessage = msg || 'Reset failed. Please try again.';
        }
      },
    });
  }
}
