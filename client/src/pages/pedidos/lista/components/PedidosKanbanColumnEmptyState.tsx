import { cn } from "@/lib/utils";

export function PedidosKanbanColumnEmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 border-2 border-dashed border-slate-300 rounded m-2 flex flex-col items-center justify-center text-slate-400 italic text-[11px] py-8",
        className,
      )}
    >
      {message}
    </div>
  );
}
