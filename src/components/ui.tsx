import type { ReactNode } from "react";

export const inputCls = "input";
export const btnPrimary = "btn btn-primary";
export const btnSecondary = "btn btn-secondary";
/** Botão-ícone de excluir: neutro, magenta no hover. */
export const btnDanger = "btn btn-ghost btn-icon btn-danger";
/** Botão-ícone neutro (editar, encerrar...). */
export const btnMuted = "btn btn-ghost btn-icon btn-muted";

type Tone = "default" | "positive" | "negative" | "muted";

export const TONE_TEXT: Record<Tone, string> = {
  default: "text-text",
  positive: "text-accent-700",
  negative: "text-accent-2-700",
  muted: "text-neutral-700",
};

/**
 * Cabeçalho de página: título, subtítulo em itálico, régua dupla,
 * linha de data (à esquerda `dateline`, à direita `monthNav` ou `aside`) e régua simples.
 */
export function PageHeader({
  title,
  subtitle,
  dateline,
  monthNav,
  aside,
  className = "mb-12",
}: {
  title: string;
  subtitle?: string;
  dateline: ReactNode;
  /** Seletor de mês: deixa a linha de data mais baixa (os botões têm 44px). */
  monthNav?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={className}>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="mb-6 max-w-[60ch] text-[17px] text-neutral-700 italic">{subtitle}</p>}
      <div className="rule-double" />
      <div className={`kicker flex flex-wrap items-center justify-between gap-x-7 gap-y-1 ${monthNav ? "py-1" : "py-3.5"}`}>
        <span>{dateline}</span>
        {monthNav ?? aside}
      </div>
      <div className="rule-single" />
    </header>
  );
}

/** Linha de números no topo das páginas. */
export function StatGrid({ children, className = "mb-[72px]" }: { children: ReactNode; className?: string }) {
  return <section className={`grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-10 gap-y-8 ${className}`}>{children}</section>;
}

export function Stat({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: ReactNode; tone?: Tone }) {
  return (
    <div className="min-w-0">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${TONE_TEXT[tone]}`}>{value}</span>
      {hint && <span className="mt-1.5 block text-[13px] text-neutral-700">{hint}</span>}
    </div>
  );
}

/** Título de seção com um complemento alinhado à direita (total, link...). */
export function SectionHead({ title, aside, small, className = "mb-3.5" }: { title: ReactNode; aside?: ReactNode; small?: boolean; className?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${className}`}>
      <h2 className={small ? "h2-sm" : "h2"}>{title}</h2>
      {aside}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

/** Barra de progresso: trilho neutral-300, sem raio. Sem `color`, usa a cor pela faixa. */
export function Progress({ value, color, height = 4 }: { value: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const auto = value > 1 ? "var(--color-accent-2-700)" : value >= 0.8 ? "var(--color-accent-2-400)" : "var(--color-accent)";
  return (
    <div className="bg-neutral-300" style={{ height }}>
      <div className="h-full" style={{ width: `${pct}%`, background: color ?? auto }} />
    </div>
  );
}

/** Marcador quadrado com a cor da categoria/cartão. */
export function Sq({ color, size = 9 }: { color: string; size?: number }) {
  return <span className="inline-block flex-none self-center" style={{ width: size, height: size, background: color }} />;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-2 text-[15px] text-neutral-700 italic">{children}</p>;
}

export function Tag({ children, tone = "accent", className = "" }: { children: ReactNode; tone?: "accent" | "accent-2"; className?: string }) {
  return <span className={`tag tag-${tone} ${className}`}>{children}</span>;
}

/** Linha de índice com pontilhado: [■] Nome ······ % valor */
export function IndexRow({
  label,
  value,
  color,
  pct,
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  color?: string;
  pct?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-2.5 text-[15px] leading-[34px] ${className}`}>
      {color && <Sq color={color} />}
      <span className="min-w-0 truncate">{label}</span>
      <span className="leader" />
      {pct && <span className="tnum text-[13px] text-neutral-700">{pct}</span>}
      <span className="tnum min-w-[94px] text-right whitespace-nowrap">{value}</span>
    </div>
  );
}

/** Índice do destaque (Painel e Investimentos): rótulo ····· valor grande, dica abaixo. */
export function HighlightIndex({ rows }: { rows: { label: string; value: string; hint?: string; tone?: Tone }[] }) {
  return (
    <div className="flex min-w-0 flex-[1_1_320px] flex-col">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col py-2.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[15px]">{r.label}</span>
            <span className="leader mb-[0.42em] min-w-6" />
            <span className={`tnum text-[22px] font-semibold ${TONE_TEXT[r.tone ?? "default"]}`}>{r.value}</span>
          </div>
          {r.hint && <span className="text-right text-[13px] text-neutral-700">{r.hint}</span>}
        </div>
      ))}
    </div>
  );
}

/** Número de destaque com o efeito de impressão em 3 chapas (C, M, Y). */
export function CmykNum({ value, className = "", style }: { value: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`cmyk-num ${className}`} style={style}>
      <span className="paper">{value}</span>
      <span className="plate plate-c" aria-hidden="true">{value}</span>
      <span className="plate plate-m" aria-hidden="true">{value}</span>
      <span className="plate plate-y" aria-hidden="true">{value}</span>
    </div>
  );
}
