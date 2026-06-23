import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-[oklch(0.16_0.025_165/0.7)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="group flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gradient-primary)] shadow-[0_0_18px_-2px_oklch(0.72_0.16_158/0.5)]">
            <Trophy className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">Brocket</div>
            {subtitle && (
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {subtitle}
              </div>
            )}
          </div>
        </Link>
        <Link
          to="/create"
          className="rounded-lg bg-[var(--gradient-primary)] px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-[0_0_18px_-4px_oklch(0.72_0.16_158/0.6)] transition-transform hover:scale-[1.02]"
        >
          Novo torneio
        </Link>
      </div>
    </header>
  );
}
