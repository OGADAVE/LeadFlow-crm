export default function KPICard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="border border-border bg-card rounded-xl p-5">
      <div
        className="icon-tile w-10 h-10 mb-4"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={20} color={iconColor} />
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-sm text-subtle mt-1">{label}</p>
    </div>
  );
}
