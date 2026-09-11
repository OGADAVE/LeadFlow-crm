import { verifyIdToken } from '../lib/verifyIdToken.js';
import { getDoc, setDoc } from '../lib/firestore.js';
import { createAuthUser, generatePasswordResetLink } from '../lib/identityToolkit.js';

const VALID_ROLES = ['admin', 'consultant', 'marketer'];

/**
 * POST /api/invite-user
 * Called by an admin. Verifies the CALLER's own role server-side (never
 * trusts anything the client claims about itself), creates the invitee's
 * Firebase Auth account + Firestore profile docs, then emails them a
 * password-reset link via Resend so they can set their own password.
 */
export async function handleInviteUser(request, env) {
  let callerUid;
  try {
    ({ uid: callerUid } = await verifyIdToken(request, env));
  } catch (err) {
    return jsonError('Unauthorized', 401);
  }

  const callerProfile = await getDoc(env, `userProfiles/${callerUid}`);
  if (!callerProfile || callerProfile.role !== 'admin') {
    return jsonError('Only admins can invite teammates.', 403);
  }

  const { email, name, role } = await request.json();
  if (!email || !name || !VALID_ROLES.includes(role)) {
    return jsonError('email, name, and a valid role are required.', 400);
  }

  const companyId = callerProfile.companyId;
  const now = new Date();

  // Temp password the invitee never sees or uses — they set their own via
  // the password-reset link we email them next.
  const tempPassword = crypto.randomUUID() + crypto.randomUUID();

  let newUid;
  try {
    ({ uid: newUid } = await createAuthUser(env, { email, password: tempPassword, displayName: name }));
  } catch (err) {
    return jsonError('Could not create that account — the email may already be in use.', 409);
  }

  await setDoc(env, `userProfiles/${newUid}`, {
    userId: newUid,
    companyId,
    role
  });

  await setDoc(env, `companies/${companyId}/users/${newUid}`, {
    userId: newUid,
    companyId,
    email,
    name,
    role,
    status: 'active',
    createdAt: now
  });

  if (role === 'consultant') {
    await setDoc(env, `companies/${companyId}/consultants/${newUid}`, {
      consultantId: newUid,
      name,
      assignedLeadCount: 0,
      conversionRate: 0,
      phone: ''
    });
  }

  const resetLink = await generatePasswordResetLink(env, email);

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'LeadFlow CRM', email: 'team@your-leadflow-domain.com' },
      to: [{ email, name }],
      subject: "You've been added to LeadFlow CRM",
      htmlContent: `
        <p>Hi ${name},</p>
        <p>You've been added to your team's LeadFlow CRM workspace as a <strong>${role}</strong>.</p>
        <p><a href="${resetLink}">Set your password and sign in →</a></p>
      `
    })
  });

  if (!brevoRes.ok) {
    // The account and profile docs are already created successfully — the
    // email is the only thing that failed. Surface this clearly rather than
    // returning a generic success, so the admin knows to share the link manually.
    return json({
      success: true,
      uid: newUid,
      emailSent: false,
      resetLink,
      warning: 'Account created, but the invite email failed to send. Share this link with them directly.'
    });
  }

  return json({ success: true, uid: newUid, emailSent: true });
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
