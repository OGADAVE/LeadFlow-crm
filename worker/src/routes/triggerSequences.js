import { verifyIdToken } from '../lib/verifyIdToken.js';
import { getDoc } from '../lib/firestore.js';
import { runSequenceSend } from './sendSequenceEmails.js';

/**
 * POST /api/trigger-sequences
 * Lets an admin run the sequence-sending job on demand instead of waiting
 * for the hourly Cloudflare Cron Trigger — mainly for testing that a
 * sequence actually sends before trusting it to run unattended.
 */
export async function handleTriggerSequences(request, env) {
  let callerUid;
  try {
    ({ uid: callerUid } = await verifyIdToken(request, env));
  } catch (err) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const callerProfile = await getDoc(env, `userProfiles/${callerUid}`);
  if (!callerProfile || callerProfile.role !== 'admin') {
    return json({ error: 'Only admins can trigger this.' }, 403);
  }

  const result = await runSequenceSend(env);
  return json(result);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
