import { AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import type { SecurityInsights } from "@/types";

type SecurityInsightsPanelProps = {
  insights: SecurityInsights;
};

export default function SecurityInsightsPanel({ insights }: SecurityInsightsPanelProps) {
  return (
    <section className="glass rounded-[28px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Security Insights</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Risk signals and recommendations</h3>
          <p className="mt-2 text-sm text-cyan-200/80">{insights.security_posture}</p>
        </div>
        <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Score</p>
          <p className="text-3xl font-semibold text-white">{insights.security_score}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          ["Weak passwords", String(insights.weak_passwords)],
          ["Reused passwords", String(insights.reused_passwords)],
          ["Compromised", String(insights.compromised_passwords)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-midnight/70 p-4">
            <p className="text-2xl font-semibold text-white">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {insights.suggestions.map((suggestion) => (
          <div key={suggestion} className="flex items-start gap-3 rounded-2xl border border-border bg-white/5 p-4">
            {suggestion.toLowerCase().includes("strong") ? (
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            ) : suggestion.toLowerCase().includes("reused") || suggestion.toLowerCase().includes("weak") ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            ) : (
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            )}
            <p className="text-sm text-slate-300">{suggestion}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
