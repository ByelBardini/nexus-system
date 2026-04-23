import { cn } from "@/lib/utils";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function PermissionCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "w-6 h-6 rounded flex items-center justify-center transition-all border-2",
        checked
          ? "bg-erp-blue border-erp-blue text-white shadow-sm"
          : "bg-white border-slate-300 hover:border-slate-400",
      )}
    >
      {checked && <CheckIcon className="w-4 h-4 stroke-[3]" />}
    </button>
  );
}

export function SectorCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-5 h-5 rounded flex items-center justify-center transition-all border-2",
        checked
          ? "bg-emerald-600 border-emerald-600 text-white"
          : "bg-white border-slate-300 hover:border-slate-400",
      )}
    >
      {checked && <CheckIcon className="w-3 h-3 stroke-[3]" />}
    </button>
  );
}
