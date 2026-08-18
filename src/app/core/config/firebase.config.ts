export const firebaseConfig = {
  apiKey: "AIzaSyCyRY6HQyT4nF7lHV5nmSJ4X2BJm4_FqZA",
  authDomain: "trivon-49fd7.firebaseapp.com",
  projectId: "trivon-49fd7",
  storageBucket: "trivon-49fd7.firebasestorage.app",
  messagingSenderId: "1040824275504",
  appId: "1:1040824275504:web:0f10d0cf65214c643493f5"
};

export function isFirebaseConfigured(): boolean {
  return Object.values(firebaseConfig).every((value) => value && !value.startsWith('REPLACE_WITH_'));
}