import { Link } from "@tanstack/react-router";

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="font-display text-[19px] font-medium tracking-tight text-foreground">
            Brocket
          </span>
          {subtitle && (
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {subtitle}
            </span>
          )}
        </Link>
        <Link
          to="/create"
          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent"
        >
          Novo torneio
        </Link>
      </div>
    </header>
  );
}
