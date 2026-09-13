import { addDoc } from '../lib/firestore.js';

// A 1x1 transparent GIF, served as the tracking pixel.
const PIXEL_BYTES = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='),
  (c) => c.charCodeAt(0)
);

/**
 * GET /track/open?companyId=X&leadId=Y&templateId=Z
 * Embedded as a 1x1 image in every sequence email. Logs an "email_opened"
 * timeline event + notification, then returns the actual pixel — the email
 * client has no idea anything else happened.
 */
export async function handleTrackOpen(request, env) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('companyId');
  const leadId = url.searchParams.get('leadId');
  const templateId = url.searchParams.get('templateId');

  if (companyId && leadId) {
    const now = new Date();
    try {
      await addDoc(env, `companies/${companyId}/leads/${leadId}/timeline`, {
        type: 'email_opened',
        meta: { templateId: templateId || null },
        createdAt: now,
        actorUserId: 'system'
      });
    } catch (err) {
      // Never let a tracking failure break the pixel response — the email
      // client is waiting on this image regardless of whether logging worked.
    }
  }

  return new Response(PIXEL_BYTES, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store'
    }
  });
}

/**
 * GET /track/click?url=ENCODED_URL&companyId=X&leadId=Y
 * Every link inside a sequence email gets rewritten to route through this
 * first. Logs an "email_clicked" timeline event + notification, then 302s
 * the visitor on to the real destination.
 */
export async function handleTrackClick(request, env) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('companyId');
  const leadId = url.searchParams.get('leadId');
  const destination = url.searchParams.get('url');

  if (!destination) {
    return new Response('Missing url parameter', { status: 400 });
  }

  if (companyId && leadId) {
    const now = new Date();
    try {
      await addDoc(env, `companies/${companyId}/leads/${leadId}/timeline`, {
        type: 'email_clicked',
        meta: { destination },
        createdAt: now,
        actorUserId: 'system'
      });

      await addDoc(env, `companies/${companyId}/notifications`, {
        type: 'email_clicked',
        message: `A lead clicked a link in your email`,
        leadId,
        read: false,
        createdAt: now
      });
    } catch (err) {
      // Same as above — never block the redirect on a logging failure.
    }
  }

  return Response.redirect(destination, 302);
}
