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
import { ref, set, update } from 'firebase/database';
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
}

// ============================================================
// Deteksi lingkungan WebView (APK wrapper).
// Google memblokir OAuth di dalam WebView (error: disallowed_useragent),
// jadi tombol "Masuk dengan Google" harus disembunyikan di sini
// dan user diarahkan pakai email-password.
// ============================================================
export function isEmbeddedWebView(): boolean {
  const ua = navigator.userAgent || '';
  const isAndroidWV = /wv/.test(ua) && /Android/.test(ua);
  // iOS WKWebView: ada AppleWebKit tapi tanpa Safari di UA
  const isIOSWV = /iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua);
  return isAndroidWV || isIOSWV;
}

// ── Google Login ──
export async function signInWithGoogle(): Promise<User> {
  if (isEmbeddedWebView()) {
    // Seharusnya tidak pernah terpanggil karena tombolnya disembunyikan,
    // tapi tetap dijaga sebagai lapisan terakhir.
    throw new Error(
      'Login Google tidak didukung di dalam aplikasi ini (kebijakan Google untuk WebView). Silakan gunakan email dan password.'
    );
  }
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

// ── Update nama tampilan (dipakai halaman Profil) ──
// Tersimpan permanen di Firebase Auth + node users/{uid}.
export async function updateDisplayName(name: string): Promise<User> {
  const fbUser = auth.currentUser;
  if (!fbUser) throw new Error('Sesi login berakhir. Silakan masuk kembali.');
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nama tidak boleh kosong.');
  await updateProfile(fbUser, { displayName: trimmed });
  await update(ref(db, `users/${fbUser.uid}`), { displayName: trimmed });
  return toAppUser(fbUser, trimmed);
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
