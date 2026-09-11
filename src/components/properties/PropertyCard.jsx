export default function PropertyCard({ property }) {
  return (
    <div className="border border-border bg-card rounded-xl overflow-hidden">
      {property.imageUrls?.[0] ? (
        <img src={property.imageUrls[0]} alt={property.name} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-raised flex items-center justify-center">
          <span className="text-xs text-subtle uppercase tracking-wide">NO IMAGE ON FILE</span>
        </div>
      )}
      <div className="p-4">
        <p className="text-ink text-sm">{property.name}</p>
        <p className="text-subtle text-xs mt-1">{property.location}</p>
        <p className="text-sm font-semibold text-brand-light mt-2">
          {property.priceFrom ? `₦${property.priceFrom.toLocaleString()}` : '—'}
          {property.priceTo ? ` – ₦${property.priceTo.toLocaleString()}` : ''}
        </p>
        <span
          className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
            property.status === 'sold_out'
              ? 'bg-danger/15 text-danger'
              : 'bg-success/15 text-success'
          }`}
        >
          {property.status === 'sold_out' ? 'Sold out' : 'Available'}
        </span>
      </div>
    </div>
  );
}
