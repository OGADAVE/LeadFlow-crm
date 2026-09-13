import { useState } from 'react';
import Papa from 'papaparse';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { UploadCloud, Download } from 'lucide-react';
import { db } from '../../lib/firebase';
import { createNotification } from '../../lib/notifications';
import { enrollLeadInMatchingSequences } from '../../lib/enrollment';
import { useAuth } from '../../context/AuthContext';
import { useConsultants } from '../../hooks/useConsultants';

const VALID_SOURCES = ['facebook', 'instagram', 'website', 'referral', 'walkin', 'whatsapp'];
const TEMPLATE_HEADERS = 'fullName,email,phone,whatsapp,source,budget,consultant';
const CHUNK_SIZE = 200; // leads per Firestore batch (2 writes each — doc + timeline — well under the 500-op batch limit)

export default function CSVImport({ onDone }) {
  const { profile } = useAuth();
  const { consultants } = useConsultants();
  const [rows, setRows] = useState([]);
  const [fileError, setFileError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileError('');
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields?.includes('fullName')) {
          setFileError('CSV must include a "fullName" column. Check the template below.');
          setRows([]);
          return;
        }
        const parsed = results.data
          .filter((row) => row.fullName?.trim())
          .map((row) => ({
            fullName: row.fullName.trim(),
            email: row.email?.trim() || '',
            phone: row.phone?.trim() || '',
            whatsapp: row.whatsapp?.trim() || '',
            source: VALID_SOURCES.includes(row.source?.trim().toLowerCase())
              ? row.source.trim().toLowerCase()
              : 'referral',
            budget: row.budget && !isNaN(Number(row.budget)) ? Number(row.budget) : null,
            consultantName: row.consultant?.trim() || ''
          }));
        setRows(parsed);
      },
      error: () => setFileError('Could not read that file — make sure it\'s a valid CSV.')
    });
  }

  async function handleImport() {
    if (!profile?.companyId || rows.length === 0) return;
    setImporting(true);

    const leadsCollection = collection(db, 'companies', profile.companyId, 'leads');
    let imported = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      const chunkLeadIds = [];

      chunk.forEach((row) => {
        const matchedConsultant = row.consultantName
          ? consultants.find((c) => c.name?.toLowerCase() === row.consultantName.toLowerCase())
          : null;

        const leadRef = doc(leadsCollection);
        chunkLeadIds.push(leadRef.id);
        batch.set(leadRef, {
          fullName: row.fullName,
          email: row.email,
          phone: row.phone,
          whatsapp: row.whatsapp,
          source: row.source,
          budget: row.budget,
          assignedConsultantId: matchedConsultant?.id || null,
          interestedPropertyId: null,
          status: 'new',
          lastContactDate: null,
          nextFollowUpDate: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tags: []
        });

        const timelineRef = doc(collection(leadRef, 'timeline'));
        batch.set(timelineRef, {
          type: 'lead_created',
          meta: { source: row.source, importedVia: 'csv' },
          createdAt: serverTimestamp(),
          actorUserId: profile.userId
        });
      });

      await batch.commit();
      imported += chunk.length;

      // Enrollment happens after the batch commits — sequential per lead since
      // it's its own query + write, not batchable. Fine at CSV-import volumes.
      for (const leadId of chunkLeadIds) {
        await enrollLeadInMatchingSequences(profile.companyId, leadId);
      }
    }

    await createNotification(profile.companyId, {
      type: 'csv_import',
      message: `${imported} lead${imported === 1 ? '' : 's'} imported via CSV`
    });

    setResult(imported);
    setImporting(false);
    setRows([]);
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_HEADERS + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leadflow-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="border border-border bg-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-ink font-medium">Import leads from CSV</p>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs text-brand hover:underline"
        >
          <Download size={14} />
          Download template
        </button>
      </div>

      <p className="text-xs text-subtle">
        Columns: <code className="text-brand-light">{TEMPLATE_HEADERS}</code> — only{' '}
        <code className="text-brand-light">fullName</code> is required. "consultant" matches
        by exact name against your existing roster; unmatched rows are left unassigned.
      </p>

      <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-6 cursor-pointer hover:border-brand transition-colors">
        <UploadCloud size={18} className="text-subtle" />
        <span className="text-sm text-subtle">Click to choose a CSV file</span>
        <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </label>

      {fileError && <p className="text-danger text-xs">{fileError}</p>}

      {rows.length > 0 && (
        <>
          <p className="text-sm text-ink">
            Found <span className="font-semibold">{rows.length}</span> valid row{rows.length === 1 ? '' : 's'} —
            preview below.
          </p>
          <div className="border border-border rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-raised">
                <tr className="text-subtle uppercase tracking-wide">
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Source</th>
                  <th className="text-left px-3 py-2">Consultant</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, idx) => (
                  <tr key={idx} className="border-t border-border/60">
                    <td className="px-3 py-2 text-ink">{row.fullName}</td>
                    <td className="px-3 py-2 text-subtle">{row.email || '—'}</td>
                    <td className="px-3 py-2 text-subtle capitalize">{row.source}</td>
                    <td className="px-3 py-2 text-subtle">{row.consultantName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="text-xs text-subtle text-center py-2">…and {rows.length - 20} more</p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full bg-brand-gradient text-white text-sm font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {importing ? 'Importing…' : `Import ${rows.length} lead${rows.length === 1 ? '' : 's'}`}
          </button>
        </>
      )}

      {result !== null && (
        <p className="text-success text-sm">
          {result} lead{result === 1 ? '' : 's'} imported successfully.{' '}
          <button onClick={onDone} className="text-brand hover:underline">Close</button>
        </p>
      )}
    </div>
  );
}
