import { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { Trash2, Pencil } from 'lucide-react';
import Topbar from '../layout/Topbar';
import EmailTemplateForm from './EmailTemplateForm';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';

export default function EmailTemplateList() {
  const { templates, loading } = useEmailTemplates();
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const isAdmin = profile?.role === 'admin';

  async function handleDelete(templateId) {
    if (!confirm('Delete this template? Any sequence step referencing it will fail to send.')) return;
    await deleteDoc(doc(db, 'companies', profile.companyId, 'emailTemplates', templateId));
  }

  return (
    <div>
      <Topbar title="Email Templates" subtitle={`${templates.length} templates`} />
      <div className="p-4 sm:p-8">
        {isAdmin && (
          <div className="mb-6">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowForm((s) => !s);
              }}
              className="text-sm border border-brand text-brand rounded-lg px-4 py-2 hover:bg-brand-gradient hover:text-white transition-colors"
            >
              {showForm ? 'Cancel' : '+ New template'}
            </button>
          </div>
        )}

        {showForm && (
          <div className="mb-6 max-w-2xl">
            <EmailTemplateForm
              existingTemplate={editingTemplate}
              onDone={() => {
                setShowForm(false);
                setEditingTemplate(null);
              }}
            />
          </div>
        )}

        {loading ? (
          <p className="text-subtle text-sm">Loading templates…</p>
        ) : templates.length === 0 ? (
          <div className="border border-border bg-card rounded-xl p-8 text-center">
            <p className="text-ink text-lg font-semibold">No templates yet</p>
            <p className="text-subtle text-sm mt-1">
              {isAdmin ? 'Create your first template to start building automated sequences.' : 'Check back once your admin adds one.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-border bg-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-ink font-medium truncate">{template.name}</p>
                    <p className="text-xs text-subtle capitalize mt-0.5">{template.category?.replace('_', ' ')}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowForm(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-raised text-subtle hover:text-brand-light transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1.5 rounded-lg hover:bg-raised text-subtle hover:text-danger transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-subtle mt-3 line-clamp-2">{template.subject}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
