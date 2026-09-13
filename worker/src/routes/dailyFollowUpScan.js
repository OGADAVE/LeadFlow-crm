import { getDueFollowUps, addDoc } from '../lib/firestore.js';

/**
 * Finds every lead across every company with a follow-up due (and not
 * already closed/lost), groups them by company, and writes ONE summary
 * notification per company — not one per lead, which would spam the bell.
 * Called from the Worker's scheduled() handler (daily) and also exposed as
 * a manual-trigger HTTP route for testing.
 */
export async function runDailyFollowUpScan(env) {
  const now = new Date();
  const dueLeads = await getDueFollowUps(env, now);

  const byCompany = {};
  for (const lead of dueLeads) {
    if (!byCompany[lead.companyId]) byCompany[lead.companyId] = [];
    byCompany[lead.companyId].push(lead);
  }

  const results = [];
  for (const [companyId, leads] of Object.entries(byCompany)) {
    await addDoc(env, `companies/${companyId}/notifications`, {
      type: 'followup_due',
      message: `${leads.length} lead${leads.length === 1 ? ' has' : 's have'} a follow-up due`,
      leadId: null,
      read: false,
      createdAt: now
    });
    results.push({ companyId, dueCount: leads.length });
  }

  return { totalDueLeads: dueLeads.length, companiesNotified: results.length, results };
}
