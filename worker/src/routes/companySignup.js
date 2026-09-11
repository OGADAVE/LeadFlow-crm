import { verifyIdToken } from '../lib/verifyIdToken.js';
import { getDoc, setDoc } from '../lib/firestore.js';

/**
 * POST /api/company-signup
 * Called right after the frontend creates a brand-new Firebase Auth account
 * via createUserWithEmailAndPassword. The caller's ID token proves who they
 * are; this endpoint creates the company doc and makes them its first admin.
 * Rejects if this uid already has a profile, so it can't be replayed.
 */
export async function handleCompanySignup(request, env) {
  let uid, email;
  try {
    ({ uid, email } = await verifyIdToken(request, env));
  } catch (err) {
    return jsonError('Unauthorized', 401);
  }

  const existingProfile = await getDoc(env, `userProfiles/${uid}`);
  if (existingProfile) {
    return jsonError('This account already belongs to a workspace.', 409);
  }

  const { companyName, name } = await request.json();
  if (!companyName || !name) {
    return jsonError('companyName and name are required.', 400);
  }

  const companyId = crypto.randomUUID();
  const now = new Date();

  await setDoc(env, `companies/${companyId}`, {
    companyId,
    name: companyName,
    plan: 'trial',
    status: 'active',
    createdAt: now,
    ownerUserId: uid,
    branding: { logoUrl: '', primaryColor: '#C9A24B' },
    settings: { whatsappNumber: '', defaultCurrency: 'NGN' }
  });

  await setDoc(env, `userProfiles/${uid}`, {
    userId: uid,
    companyId,
    role: 'admin'
  });

  await setDoc(env, `companies/${companyId}/users/${uid}`, {
    userId: uid,
    companyId,
    email,
    name,
    role: 'admin',
    status: 'active',
    createdAt: now
  });

  return json({ success: true, companyId });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function jsonError(message, status) {
  return json({ error: message }, status);
}
