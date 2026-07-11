import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, googleProvider, db } from './firebase';
import { User } from './types';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';

interface AuthProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  lastLogin: string;
}

function toAppUser(fbUser: FirebaseUser, nameOverride?: string): User {
  return {
    uid: fbUser.uid,
    name: nameOverride || fbUser.displayName || 'Pengguna Lumina',
    email: fbUser.email || '',
    avatarUrl: fbUser.photoURL || DEFAULT_AVATAR,
  };
}

// Simpan: uid, displayName, email, photoURL, lastLogin -> users/{uid}
async function saveAuthProfile(fbUser: FirebaseUser, nameOverride?: string): Promise<void> {
  const profile: AuthProfile = {
    uid: fbUser.uid,
    displayName: nameOverride || fbUser.displayName || 'Pengguna Lumina',
    email: fbUser.email || '',
    photoURL: fbUser.photoURL || DEFAULT_AVATAR,
    lastLogin: new Date().toISOString(),
  };
  await set(ref(db, `users/${fbUser.uid}`), profile);
  console.log('✅ Profil auth tersimpan ke Firebase:', profile.email);
}

// ── Google Login ──
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await saveAuthProfile(result.user);
  return toAppUser(result.user);
}

// ── Email & Password: Masuk ──
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await saveAuthProfile(result.user);
  return toAppUser(result.user);
}

// ── Email & Password: Daftar akun baru ──
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  await saveAuthProfile(result.user, name);
  return toAppUser(result.user, name);
}

// ── Lupa Password ──
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ── Logout ──
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// ── Listener status login (dipakai AuthContext) ──
export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, (fbUser) => {
    callback(fbUser ? toAppUser(fbUser) : null);
  });
}
