import { useState } from 'react';
import Topbar from '../layout/Topbar';
import PropertyCard from './PropertyCard';
import PropertyForm from './PropertyForm';
import { useProperties } from '../../hooks/useProperties';
import { useAuth } from '../../context/AuthContext';

export default function PropertyList() {
  const { properties, loading } = useProperties();
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const isAdmin = profile?.role === 'admin';

  return (
    <div>
      <Topbar title="Properties" subtitle={`${properties.length} in the library`} />
      <div className="p-8">
        {isAdmin && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm((s) => !s)}
              className="text-sm border border-brand text-brand rounded-lg px-4 py-2 hover:bg-brand-gradient hover:text-white transition-colors"
            >
              {showForm ? 'Cancel' : '+ Add property'}
            </button>
            {showForm && (
              <div className="mt-4 max-w-md">
                <PropertyForm onDone={() => setShowForm(false)} />
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-subtle text-sm">Loading library…</p>
        ) : properties.length === 0 ? (
          <div className="border border-border p-8 text-center">
            <p className="text-ink  text-lg">No properties yet</p>
            <p className="text-subtle text-sm mt-1">
              {isAdmin ? 'Add your first property to start linking it to leads and campaigns.' : 'Check back once your admin adds a listing.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
