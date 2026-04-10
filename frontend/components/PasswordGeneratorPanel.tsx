import { useState } from "react";
import { Dice5, WandSparkles } from "lucide-react";
import type { GeneratedPassword, PasswordGeneratorOptions } from "@/types";

type PasswordGeneratorPanelProps = {
  generated: GeneratedPassword | null;
  onGenerate: (options: PasswordGeneratorOptions) => Promise<void>;
  onUse: (password: string) => void;
};

export default function PasswordGeneratorPanel({ generated, onGenerate, onUse }: PasswordGeneratorPanelProps) {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  return (
    <section className="glass rounded-[28px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Generator</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Create strong passwords</h3>
        </div>
        <div className="rounded-2xl border border-signal/20 bg-signal/10 p-3 text-signal">
          <Dice5 className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-sm text-slate-300">
          Length: <span className="font-semibold text-white">{options.length}</span>
        </label>
        <input
          type="range"
          min={8}
          max={64}
          value={options.length}
          onChange={(event) => setOptions((current) => ({ ...current, length: Number(event.target.value) }))}
          className="mt-3 w-full"
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          ["uppercase", "Uppercase"],
          ["lowercase", "Lowercase"],
          ["numbers", "Numbers"],
          ["symbols", "Symbols"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(options[key as keyof PasswordGeneratorOptions])}
              onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="mt-5 flex gap-3">
        <button onClick={() => void onGenerate(options)} className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-slate-950">
          <span className="inline-flex items-center gap-2">
            <WandSparkles className="h-4 w-4" />
            Generate
          </span>
        </button>
        {generated && (
          <button onClick={() => onUse(generated.password)} className="rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm font-medium text-white">
            Use for new entry
          </button>
        )}
      </div>

      {generated && (
        <div className="mt-5 rounded-2xl border border-border bg-midnight/70 p-4">
          <p className="font-mono text-sm text-accent break-all">{generated.password}</p>
          <p className="mt-3 text-sm text-slate-300">
            Strength: <span className="font-medium text-white">{generated.analysis.strength}</span> ({generated.analysis.score}/100)
          </p>
        </div>
      )}
    </section>
  );
}
