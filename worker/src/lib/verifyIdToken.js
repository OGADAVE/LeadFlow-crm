import { createRemoteJWKSet, jwtVerify } from 'jose';

// Google publishes the public keys used to sign Firebase Auth ID tokens here.
// `jose`'s remote JWKS set caches these automatically across requests.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

/**
 * Verifies the Firebase ID token sent in an Authorization: Bearer <token>
 * header. Returns { uid, email } on success, throws on any failure —
 * expired, wrong project, bad signature, missing header, all of it.
 */
export async function verifyIdToken(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error('Missing Authorization header');

  const projectId = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id;

  const { payload } = await jwtVerify(match[1], JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId
  });

  if (!payload.sub || !payload.email) {
    throw new Error('ID token missing required claims');
  }

  return { uid: payload.sub, email: payload.email };
}
