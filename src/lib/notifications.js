import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Writes a notification for the company. Currently written directly by the
 * client (no Cloud Functions) — same tradeoff as the lead timeline. Visible
 * to every member of the company for now; per-user targeting (e.g. only the
 * assigned consultant) can be added once there's a real need for it.
 */
export async function createNotification(companyId, { type, message, leadId }) {
  await addDoc(collection(db, 'companies', companyId, 'notifications'), {
    type,
    message,
    leadId: leadId || null,
    read: false,
    createdAt: serverTimestamp()
  });
}
