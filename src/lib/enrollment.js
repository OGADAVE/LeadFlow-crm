import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Checks for active sequences matching a trigger and enrolls the given lead
 * into each match, starting at step 1. The actual sending happens in the
 * Cloudflare Worker's scheduled handler — this just queues it up.
 */
export async function enrollLeadInMatchingSequences(companyId, leadId, trigger = 'lead_created') {
  const sequencesQuery = query(
    collection(db, 'companies', companyId, 'sequences'),
    where('trigger', '==', trigger),
    where('active', '==', true)
  );
  const snap = await getDocs(sequencesQuery);

  for (const sequenceDoc of snap.docs) {
    const sequence = sequenceDoc.data();
    const firstStep = sequence.steps?.[0];
    if (!firstStep) continue;

    const nextSendAt = new Date(Date.now() + (firstStep.delayDays || 0) * 24 * 60 * 60 * 1000);

    await addDoc(collection(db, 'companies', companyId, 'sequenceEnrollments'), {
      leadId,
      sequenceId: sequenceDoc.id,
      currentStep: firstStep.order,
      nextSendAt,
      status: 'active',
      createdAt: serverTimestamp()
    });
  }
}
