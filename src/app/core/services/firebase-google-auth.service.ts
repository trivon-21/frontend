import { Injectable } from '@angular/core';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase.config';
import { initializeApp, getApps } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';

export interface GoogleSignInSession {
  idToken: string;
  email: string;
  fullName: string;
  photoURL: string;
}

@Injectable({ providedIn: 'root' })
export class FirebaseGoogleAuthService {
  private readonly auth = getAuth(getApps().length ? getApps()[0] : initializeApp(firebaseConfig));

  private ensureConfigured(): void {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Set the values in src/app/core/config/firebase.config.ts.');
    }
  }

  async signInWithGoogle(): Promise<GoogleSignInSession> {
    this.ensureConfigured();

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(this.auth, provider);
    const idToken = await result.user.getIdToken();

    return {
      idToken,
      email: result.user.email || '',
      fullName: result.user.displayName || '',
      photoURL: result.user.photoURL || '',
    };
  }
}