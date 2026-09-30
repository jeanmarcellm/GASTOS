import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import type { Insight } from "@/lib/insights";

const STYLES = {
  danger: { icon: OctagonAlert, cls: "border-red-200 bg-red-50/60", iconCls: "text-red-600" },
  warning: { icon: AlertTriangle, cls: "border-amber-200 bg-amber-50/60", iconCls: "text-amber-600" },
  info: { icon: Info, cls: "border-sky-200 bg-sky-50/60", iconCls: "text-sky-600" },
  positive: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50/60", iconCls: "text-emerald-600" },
};

export function InsightList({ insights }: { insights: Insight[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {insights.map((i) => {
        const { icon: Icon, cls, iconCls } = STYLES[i.level];
        return (
          <li key={i.id} className={`flex gap-3 rounded-lg border p-3 ${cls}`}>
            <Icon className={`mt-0.5 size-5 shrink-0 ${iconCls}`} />
            <div>
              <p className="text-sm font-medium text-zinc-900">{i.title}</p>
              <p className="mt-0.5 text-sm text-zinc-600">{i.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
