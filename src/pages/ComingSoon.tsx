import { Link } from "react-router-dom";

export default function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen animate-fade-in px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          This screen is being migrated to React next. The legacy version is still available at{" "}
          <Link to="/legacy" className="font-semibold text-foreground underline">/legacy</Link>.
        </p>
      </div>
    </div>
  );
}
