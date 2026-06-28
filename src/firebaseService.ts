import { ref, set, get, remove } from 'firebase/database';
import { db } from './firebase';
import { AssessmentResult, StoredAssessment, User } from './types';

const encodePath = (email: string) => email.replace(/\./g, '_');

function toStoredAssessment(uid: string, email: string, result: AssessmentResult): StoredAssessment {
  return {
    assessmentId: result.id,
    uid,
    email,
    date: result.date,
    score: result.score,
    riskLevel: result.riskLevel,
    input: result.input,
    shapAnalysis: result.shapFactors,
    recommendations: result.recommendations,
    createdAt: new Date().toISOString(),
  };
}

function fromStoredAssessment(stored: StoredAssessment): AssessmentResult {
  return {
    id: stored.assessmentId,
    date: stored.date,
    score: stored.score,
    riskLevel: stored.riskLevel,
    input: stored.input,
    shapFactors: stored.shapAnalysis,
    recommendations: stored.recommendations,
  };
}

export async function createAssessment(uid: string, email: string, result: AssessmentResult): Promise<void> {
  const stored = toStoredAssessment(uid, email, result);
  await set(ref(db, `assessments/${uid}/${result.id}`), stored);
  console.log('✅ Assessment tersimpan ke Firebase:', result.id);
}

export async function getAssessmentHistory(uid: string): Promise<AssessmentResult[]> {
  const snapshot = await get(ref(db, `assessments/${uid}`));
  if (!snapshot.exists()) return [];
  const data = snapshot.val() as Record<string, StoredAssessment>;
  const list = Object.values(data).map(fromStoredAssessment);
  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAssessmentById(uid: string, assessmentId: string): Promise<AssessmentResult | null> {
  const snapshot = await get(ref(db, `assessments/${uid}/${assessmentId}`));
  if (!snapshot.exists()) return null;
  return fromStoredAssessment(snapshot.val() as StoredAssessment);
}

export async function deleteAssessment(uid: string, assessmentId: string): Promise<void> {
  await remove(ref(db, `assessments/${uid}/${assessmentId}`));
  console.log('✅ Assessment dihapus:', assessmentId);
}

export async function saveUser(user: User): Promise<void> {
  const key = user.uid || encodePath(user.email);
  await set(ref(db, `users/${key}`), user);
  console.log('✅ User tersimpan ke Firebase:', user.email);
}