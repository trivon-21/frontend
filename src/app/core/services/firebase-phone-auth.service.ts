import { Injectable } from '@angular/core';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase.config';
import { initializeApp, getApps } from 'firebase/app';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  UserCredential,
  getAuth,
  signInWithPhoneNumber,
} from 'firebase/auth';

export interface PhoneVerificationSession {
  phoneNumber: string;
  confirmationResult: ConfirmationResult;
}

@Injectable({ providedIn: 'root' })
export class FirebasePhoneAuthService {
  private readonly auth = getAuth(getApps().length ? getApps()[0] : initializeApp(firebaseConfig));
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  private ensureConfigured(): void {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Set the values in src/app/core/config/firebase.config.ts.');
    }
  }

  normalizePhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.trim().replace(/[\s\-]/g, '');

    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    if (/^0\d{9}$/.test(cleaned)) {
      return `+94${cleaned.slice(1)}`;
    }

    return cleaned;
  }

  private createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
    this.recaptchaVerifier?.clear();

    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
      size: 'invisible',
    });

    return this.recaptchaVerifier;
  }

  async sendVerificationCode(phoneNumber: string, containerId = 'firebase-recaptcha-container'): Promise<PhoneVerificationSession> {
    this.ensureConfigured();

    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const verifier = this.createRecaptchaVerifier(containerId);
    await verifier.render();

    const confirmationResult = await signInWithPhoneNumber(this.auth, normalizedPhone, verifier);

    return {
      phoneNumber: normalizedPhone,
      confirmationResult,
    };
  }

  async confirmVerificationCode(session: PhoneVerificationSession, code: string): Promise<UserCredential> {
    this.ensureConfigured();
    return session.confirmationResult.confirm(code);
  }

  resetVerifier(): void {
    this.recaptchaVerifier?.clear();
    this.recaptchaVerifier = null;
  }
}