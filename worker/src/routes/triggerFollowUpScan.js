import { verifyIdToken } from '../lib/verifyIdToken.js';
import { getDoc } from '../lib/firestore.js';
import { runDailyFollowUpScan } from './dailyFollowUpScan.js';

/**
 * POST /api/trigger-followup-scan
 * Lets an admin run the daily follow-up scan on demand instead of waiting
 * for the scheduled Cloudflare Cron Trigger.
 */
export async function handleTriggerFollowUpScan(request, env) {
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

  const result = await runDailyFollowUpScan(env);
  return json(result);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
