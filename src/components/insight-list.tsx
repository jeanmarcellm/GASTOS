import type { Insight, InsightLevel } from "@/lib/insights";
import { Icon, type IconName } from "./icon";

const LEVELS: Record<InsightLevel, { icon: IconName; color: string; label: string }> = {
  danger: { icon: "warning-octagon", color: "var(--color-accent-2-700)", label: "Alerta" },
  warning: { icon: "warning", color: "var(--color-accent-2-600)", label: "Atenção" },
  info: { icon: "info", color: "var(--color-accent-700)", label: "Informação" },
  positive: { icon: "check-circle", color: "var(--color-accent-700)", label: "Bom sinal" },
};

export function InsightList({ insights, showLevel }: { insights: Insight[]; showLevel?: boolean }) {
  return (
    <ul className={`flex flex-col ${showLevel ? "gap-7" : "gap-[26px]"}`}>
      {insights.map((i) => {
        const level = LEVELS[i.level];
        return (
          <li key={i.id} className="flex gap-4">
            <Icon name={level.icon} size={24} className="mt-px flex-none" style={{ color: level.color }} />
            <div>
              {showLevel && (
                <span className="mb-0.5 block text-[11px] tracking-[0.1em] uppercase" style={{ color: level.color }}>
                  {level.label}
                </span>
              )}
              <p className="text-lg leading-[1.3] font-semibold">{i.title}</p>
              <p className={`mt-1 text-[15px] leading-[1.55] text-neutral-800 ${showLevel ? "max-w-[64ch]" : "max-w-[62ch]"}`}>{i.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
