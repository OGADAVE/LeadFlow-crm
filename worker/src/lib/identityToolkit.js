import { getGoogleAccessToken, getProjectId } from './googleAuth.js';

const BASE = 'https://identitytoolkit.googleapis.com/v2';
const BASE_V1 = 'https://identitytoolkit.googleapis.com/v1';

/**
 * Creates a new Firebase Auth user with admin privileges (arbitrary email,
 * server-chosen temp password). This is the Worker's equivalent of
 * admin.auth().createUser() from the old Cloud Function.
 */
export async function createAuthUser(env, { email, password, displayName }) {
  const token = await getGoogleAccessToken(env);
  const projectId = getProjectId(env);

  const res = await fetch(`${BASE}/projects/${projectId}/accounts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, displayName, emailVerified: false })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createAuthUser failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  // v2 accounts.create returns the new user's localId as `localId`
  return { uid: data.localId };
}

/**
 * Generates a password-reset action link (the invitee clicks this to set
 * their own password). Equivalent to admin.auth().generatePasswordResetLink().
 */
export async function generatePasswordResetLink(env, email) {
  const token = await getGoogleAccessToken(env);
  const projectId = getProjectId(env);

  const res = await fetch(`${BASE_V1}/projects/${projectId}:sendOobCode`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requestType: 'PASSWORD_RESET',
      email,
      returnOobLink: true
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`generatePasswordResetLink failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.oobLink;
}
