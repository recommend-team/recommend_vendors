
export function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={[
              'h-1.5 flex-1 rounded-full transition-colors',
              index < step ? 'bg-accent' : 'bg-hairline',
            ].join(' ')}
          />
        ))}
      </div>
      <span className="shrink-0 text-[11px] font-extrabold tracking-widest text-ink-faint uppercase">
        Step {step} of {total}
      </span>
    </div>
  );
}
