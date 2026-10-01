import { Icon } from "@/components/icon";
import { todayLong } from "@/lib/months";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container flex min-h-screen flex-1 flex-col bg-bg px-[max(20px,5.5%)] py-[clamp(24px,5cqi,72px)]">
      <div className="rule-double" />
      <div className="kicker flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
        <span>Finanças pessoais</span>
        <span>{todayLong()}</span>
      </div>
      <div className="rule-single" />

      <main className="flex flex-wrap items-center gap-x-24 gap-y-12 pt-[clamp(40px,7cqi,96px)] pb-6">
        <div className="min-w-0 flex-[1_1_380px]">
          <div className="mb-6 flex items-center gap-3.5">
            <Icon name="wallet" className="size-[clamp(34px,4cqi,48px)] text-accent" />
            <span className="kicker">Gerenciador de gastos</span>
          </div>
          <h1 className="cmyk-head -ml-[0.04em] text-[clamp(68px,13cqi,168px)] leading-[0.95] tracking-[-0.04em]">
            <span className="paper">Gastos</span>
            <span className="plate plate-c" aria-hidden="true">Gastos</span>
            <span className="plate plate-m" aria-hidden="true">Gastos</span>
            <span className="plate plate-y" aria-hidden="true">Gastos</span>
          </h1>
          <p className="mt-7 max-w-[24ch] text-[clamp(20px,2.2cqi,26px)] leading-[1.4] italic">Entenda para onde vai o seu dinheiro.</p>
        </div>
        <div className="w-full min-w-0 flex-[0_1_400px]">{children}</div>
      </main>
    </div>
  );
}
