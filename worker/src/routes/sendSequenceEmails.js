import { getDoc, patchDoc, addDoc, getDueSequenceEnrollments } from '../lib/firestore.js';

// Must match a sender verified in your Brevo account (Senders, Domains &
// Dedicated IPs → Senders) — Brevo rejects sends from unverified addresses.
const SENDER_EMAIL = 'virtuousdave32@gmail.com';
const SENDER_NAME = 'LeadFlow CRM';

function personalize(text, { fullName, consultantName }) {
  return (text || '')
    .replace(/{{fullName}}/g, fullName || '')
    .replace(/{{consultantName}}/g, consultantName || 'your consultant');
}

/**
 * Rewrites every <a href="..."> in the email to route through the click
 * tracker first, and appends an invisible tracking pixel at the end for
 * opens. Simple regex-based rewriting — good enough for the plain HTML
 * templates this app generates, not a full HTML parser.
 */
function injectTracking(html, { workerUrl, companyId, leadId, templateId }) {
  const trackedHtml = (html || '').replace(
    /href=(["'])(https?:\/\/[^"']+)\1/gi,
    (match, quote, originalUrl) => {
      const trackedUrl = `${workerUrl}/track/click?url=${encodeURIComponent(originalUrl)}&companyId=${companyId}&leadId=${leadId}`;
      return `href=${quote}${trackedUrl}${quote}`;
    }
  );

  const pixelUrl = `${workerUrl}/track/open?companyId=${companyId}&leadId=${leadId}&templateId=${templateId}`;
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;

  return `${trackedHtml}\n${pixelTag}`;
}

async function sendBrevoEmail(env, { to, name, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to, name }],
      subject,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }
}

/**
 * Scans every company for sequence enrollments due to send right now, sends
 * the current step's email via Brevo, logs it to the lead's timeline and the
 * company's notifications, then either advances to the next step or marks
 * the enrollment completed. Called from the Worker's scheduled() handler
 * (Cloudflare Cron) and also exposed as a manual-trigger HTTP route for
 * testing without waiting for the schedule.
 */
export async function runSequenceSend(env) {
  const now = new Date();
  const dueEnrollments = await getDueSequenceEnrollments(env, now);
  const results = [];

  for (const enrollment of dueEnrollments) {
    const enrollmentPath = `companies/${enrollment.companyId}/sequenceEnrollments/${enrollment.enrollmentId}`;

    try {
      const sequence = await getDoc(env, `companies/${enrollment.companyId}/sequences/${enrollment.sequenceId}`);
      if (!sequence || !sequence.active) {
        await patchDoc(env, enrollmentPath, { status: 'paused' });
        results.push({ enrollmentId: enrollment.enrollmentId, status: 'paused', reason: 'sequence inactive or deleted' });
        continue;
      }

      const currentStepDef = sequence.steps?.find((s) => s.order === enrollment.currentStep);
      if (!currentStepDef) {
        await patchDoc(env, enrollmentPath, { status: 'completed' });
        results.push({ enrollmentId: enrollment.enrollmentId, status: 'completed', reason: 'no matching step' });
        continue;
      }

      const lead = await getDoc(env, `companies/${enrollment.companyId}/leads/${enrollment.leadId}`);
      if (!lead) {
        await patchDoc(env, enrollmentPath, { status: 'completed' });
        results.push({ enrollmentId: enrollment.enrollmentId, status: 'completed', reason: 'lead no longer exists' });
        continue;
      }

      const template = await getDoc(env, `companies/${enrollment.companyId}/emailTemplates/${currentStepDef.templateId}`);
      if (!template) {
        await patchDoc(env, enrollmentPath, { status: 'paused' });
        results.push({ enrollmentId: enrollment.enrollmentId, status: 'paused', reason: 'template missing' });
        continue;
      }

      if (lead.email) {
        let consultantName = null;
        if (lead.assignedConsultantId) {
          const consultant = await getDoc(env, `companies/${enrollment.companyId}/consultants/${lead.assignedConsultantId}`);
          consultantName = consultant?.name;
        }

        await sendBrevoEmail(env, {
          to: lead.email,
          name: lead.fullName,
          subject: personalize(template.subject, { fullName: lead.fullName, consultantName }),
          html: injectTracking(
            personalize(template.htmlBody, { fullName: lead.fullName, consultantName }),
            {
              workerUrl: env.WORKER_URL,
              companyId: enrollment.companyId,
              leadId: enrollment.leadId,
              templateId: currentStepDef.templateId
            }
          )
        });

        await addDoc(env, `companies/${enrollment.companyId}/leads/${enrollment.leadId}/timeline`, {
          type: 'email_sent',
          meta: { templateId: currentStepDef.templateId, sequenceId: enrollment.sequenceId },
          createdAt: now,
          actorUserId: 'system'
        });

        await addDoc(env, `companies/${enrollment.companyId}/notifications`, {
          type: 'email_sent',
          message: `Sequence email sent to ${lead.fullName}`,
          leadId: enrollment.leadId,
          read: false,
          createdAt: now
        });
      }

      const nextStepDef = sequence.steps.find((s) => s.order === enrollment.currentStep + 1);
      if (nextStepDef) {
        const nextSendAt = new Date(now.getTime() + nextStepDef.delayDays * 24 * 60 * 60 * 1000);
        await patchDoc(env, enrollmentPath, { currentStep: nextStepDef.order, nextSendAt });
        results.push({ enrollmentId: enrollment.enrollmentId, status: 'advanced', nextStep: nextStepDef.order });
      } else {
        await patchDoc(env, enrollmentPath, { status: 'completed' });
        results.push({ enrollmentId: enrollment.enrollmentId, status: 'completed' });
      }
    } catch (err) {
      results.push({ enrollmentId: enrollment.enrollmentId, status: 'error', error: err.message });
    }
  }

  return { processed: dueEnrollments.length, results };
}
