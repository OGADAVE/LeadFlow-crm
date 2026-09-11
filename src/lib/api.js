import { auth } from './firebase';

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

/**
 * Calls a Worker endpoint, attaching the current signed-in user's Firebase
 * ID token so the Worker can verify who's calling. Throws with the Worker's
 * own error message on failure, so callers can show it directly.
 */
export async function callWorker(path, body) {
  if (!auth.currentUser) {
    throw new Error('You must be signed in.');
  }
  const idToken = await auth.currentUser.getIdToken();

  const res = await fetch(`${WORKER_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}
