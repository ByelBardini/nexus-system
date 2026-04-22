import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { ReactNode } from "react";

type ConfigFormModalProps = {
  open: boolean;
  title: string;
  headerIcon: string;
  onClose: () => void;
  children: ReactNode;
  onSave: () => void;
  saveDisabled?: boolean;
  savePending: boolean;
  saveLabel?: string;
};

export function ConfigFormModal({
  open,
  title,
  headerIcon,
  onClose,
  children,
  onSave,
  saveDisabled = false,
  savePending,
  saveLabel = "Salvar",
}: ConfigFormModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        hideClose
        className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
      >
        <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MaterialIcon
              name={headerIcon}
              className="text-blue-600"
            />
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        {children}
        <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={savePending}>
            Cancelar
          </Button>
          <Button
            className="bg-erp-blue hover:bg-blue-700"
            onClick={onSave}
            disabled={saveDisabled || savePending}
          >
            {savePending ? "Salvando..." : saveLabel}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
