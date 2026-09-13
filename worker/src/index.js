import { handleCompanySignup } from './routes/companySignup.js';
import { handleInviteUser } from './routes/inviteUser.js';
import { handleTriggerSequences } from './routes/triggerSequences.js';
import { runSequenceSend } from './routes/sendSequenceEmails.js';
import { handleTrackOpen, handleTrackClick } from './routes/tracking.js';
import { handleTriggerFollowUpScan } from './routes/triggerFollowUpScan.js';
import { runDailyFollowUpScan } from './routes/dailyFollowUpScan.js';

// Restrict this to your actual frontend origin(s) once you know them —
// e.g. ['https://leadflow.ogadaveconcepts.com.ng', 'http://localhost:5173']
const ALLOWED_ORIGINS = ['*'];

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes('*') ? '*' : origin;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);
    let response;

    try {
      if (url.pathname === '/api/company-signup' && request.method === 'POST') {
        response = await handleCompanySignup(request, env);
      } else if (url.pathname === '/api/invite-user' && request.method === 'POST') {
        response = await handleInviteUser(request, env);
      } else if (url.pathname === '/api/trigger-sequences' && request.method === 'POST') {
        response = await handleTriggerSequences(request, env);
      } else if (url.pathname === '/track/open' && request.method === 'GET') {
        response = await handleTrackOpen(request, env);
      } else if (url.pathname === '/track/click' && request.method === 'GET') {
        response = await handleTrackClick(request, env);
      } else if (url.pathname === '/api/trigger-followup-scan' && request.method === 'POST') {
        response = await handleTriggerFollowUpScan(request, env);
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (err) {
      response = new Response(JSON.stringify({ error: 'Internal error', detail: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Attach CORS headers to whatever the route returned
    const newHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([k, v]) => newHeaders.set(k, v));
    return new Response(response.body, { status: response.status, headers: newHeaders });
  },

  // Cloudflare Cron Trigger — event.cron tells us which of the two schedules
  // in wrangler.toml fired, so one scheduled() handler can run both jobs.
  // ctx.waitUntil keeps the Worker alive until the job finishes, since
  // neither is tied to an HTTP response.
  async scheduled(event, env, ctx) {
    if (event.cron === '0 6 * * *') {
      ctx.waitUntil(runDailyFollowUpScan(env));
    } else {
      ctx.waitUntil(runSequenceSend(env));
    }
  }
};
