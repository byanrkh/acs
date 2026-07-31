import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p
          className={cn(
            spaceMono.className,
            "text-[10px] uppercase tracking-widest text-black/40",
          )}
        >
          {eyebrow}
        </p>
        <h1
          className={cn(
            SpecialGhotic.className,
            "mt-1 text-2xl uppercase leading-tight tracking-tight sm:text-3xl",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm text-black/60">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
