import clsx from "clsx";

type LogoProps = {
  compact?: boolean;
  className?: string;
  premium?: boolean;
};

export default function Logo({ compact = false, className, premium = false }: LogoProps) {
  return (
    <div className={clsx("flex items-center gap-3", premium && "securestore-plus-logo", className)}>
      <div className={clsx("rounded-2xl shadow-[0_0_20px_rgba(0,234,255,0.18)]", premium && "shadow-[0_0_26px_rgba(255,207,87,0.34)]")}>
        <img
          src="/favicon.svg"
          alt="SecureStore logo"
          className={clsx(compact ? "h-9 w-9" : "h-12 w-12")}
        />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.38em] text-cyan-300/60">Secure Future</p>
        <p className={clsx("font-semibold tracking-[0.12em] text-white", compact ? "text-lg" : "text-2xl")}>
          SecureStore
          {premium && <span className="ml-1 text-amber-300 drop-shadow-[0_0_10px_rgba(255,207,87,0.75)]">+</span>}
        </p>
      </div>
    </div>
  );
}
