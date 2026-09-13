import { getGoogleAccessToken, getProjectId } from './googleAuth.js';

function baseUrl(env) {
  return `https://firestore.googleapis.com/v1/projects/${getProjectId(env)}/databases/(default)/documents`;
}

// Firestore REST API represents values as typed objects, e.g.
// { stringValue: "x" } or { integerValue: "5" }. These two helpers convert
// between that and plain JS objects so the rest of our code can just use
// normal objects.
function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestoreFields(value) } };
  }
  throw new Error(`Unsupported Firestore value type: ${typeof value}`);
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

function fromFirestoreValue(value) {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return new Date(value.timestampValue);
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) return fromFirestoreFields(value.mapValue.fields || {});
  return null;
}

function fromFirestoreFields(fields) {
  const obj = {};
  for (const [key, value] of Object.entries(fields)) {
    obj[key] = fromFirestoreValue(value);
  }
  return obj;
}

/**
 * Updates only the given fields on an existing document, leaving everything
 * else untouched — unlike setDoc, which replaces the whole document.
 */
export async function patchDoc(env, path, data) {
  const token = await getGoogleAccessToken(env);
  const fieldMask = Object.keys(data).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join('&');
  const res = await fetch(`${baseUrl(env)}/${path}?${fieldMask}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore patchDoc failed for ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Runs a collectionGroup query across ALL companies' sequenceEnrollments for
 * ones that are due to send (status == active, nextSendAt <= now). Returns
 * plain objects with companyId, enrollmentId, and the doc's fields — the
 * caller doesn't need to know anything about Firestore's REST document format.
 */
export async function getDueSequenceEnrollments(env, nowDate) {
  const token = await getGoogleAccessToken(env);
  const projectId = getProjectId(env);

  const structuredQuery = {
    from: [{ collectionId: 'sequenceEnrollments', allDescendants: true }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: 'status' },
              op: 'EQUAL',
              value: { stringValue: 'active' }
            }
          },
          {
            fieldFilter: {
              field: { fieldPath: 'nextSendAt' },
              op: 'LESS_THAN_OR_EQUAL',
              value: { timestampValue: nowDate.toISOString() }
            }
          }
        ]
      }
    },
    orderBy: [{ field: { fieldPath: 'nextSendAt' }, direction: 'ASCENDING' }],
    limit: 200
  };

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ structuredQuery })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore runQuery failed: ${res.status} ${text}`);
  }

  const results = await res.json();

  return results
    .filter((r) => r.document)
    .map((r) => {
      // r.document.name looks like:
      // projects/{proj}/databases/(default)/documents/companies/{companyId}/sequenceEnrollments/{enrollmentId}
      const parts = r.document.name.split('/');
      const companyId = parts[parts.indexOf('companies') + 1];
      const enrollmentId = parts[parts.length - 1];
      return {
        companyId,
        enrollmentId,
        ...fromFirestoreFields(r.document.fields || {})
      };
    });
}

/**
 * Runs a collectionGroup query across ALL companies' leads for ones with a
 * follow-up due (nextFollowUpDate <= now). Deliberately does NOT also filter
 * status in the query — Firestore only allows one field to have an
 * inequality filter per query, and status (excluding closed/lost) would be
 * a second one on top of the date range. The caller filters status after
 * fetching instead.
 */
export async function getDueFollowUps(env, nowDate) {
  const token = await getGoogleAccessToken(env);
  const projectId = getProjectId(env);

  const structuredQuery = {
    from: [{ collectionId: 'leads', allDescendants: true }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'nextFollowUpDate' },
        op: 'LESS_THAN_OR_EQUAL',
        value: { timestampValue: nowDate.toISOString() }
      }
    },
    orderBy: [{ field: { fieldPath: 'nextFollowUpDate' }, direction: 'ASCENDING' }],
    limit: 500
  };

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ structuredQuery })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore getDueFollowUps query failed: ${res.status} ${text}`);
  }

  const results = await res.json();

  return results
    .filter((r) => r.document)
    .map((r) => {
      const parts = r.document.name.split('/');
      const companyId = parts[parts.indexOf('companies') + 1];
      const leadId = parts[parts.length - 1];
      return {
        companyId,
        leadId,
        ...fromFirestoreFields(r.document.fields || {})
      };
    })
    .filter((lead) => lead.status !== 'closed' && lead.status !== 'lost');
}

/**
 * Creates (or overwrites) a document at an exact path, e.g.
 * setDoc(env, 'userProfiles/abc123', { companyId: 'x', role: 'admin' })
 */
export async function setDoc(env, path, data) {
  const token = await getGoogleAccessToken(env);
  const res = await fetch(`${baseUrl(env)}/${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore setDoc failed for ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Reads a document at an exact path. Returns null if it doesn't exist.
 */
export async function getDoc(env, path) {
  const token = await getGoogleAccessToken(env);
  const res = await fetch(`${baseUrl(env)}/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore getDoc failed for ${path}: ${res.status} ${text}`);
  }

  const doc = await res.json();
  return fromFirestoreFields(doc.fields || {});
}

/**
 * Adds a new document with an auto-generated ID under a collection path,
 * e.g. addDoc(env, 'companies/xyz/leads', { fullName: '...' })
 */
export async function addDoc(env, collectionPath, data) {
  const token = await getGoogleAccessToken(env);
  const res = await fetch(`${baseUrl(env)}/${collectionPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore addDoc failed for ${collectionPath}: ${res.status} ${text}`);
  }
  return res.json();
}
