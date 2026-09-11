export default function Topbar({ title, subtitle }) {
  return (
    <div className="px-8 pt-8 pb-2">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      {subtitle && <p className="text-sm text-subtle mt-1">{subtitle}</p>}
    </div>
  );
}
