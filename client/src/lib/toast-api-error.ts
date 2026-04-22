import { toast } from "sonner";

/**
 * Exibe toast de erro a partir de um catch (Error com mensagem ou valor desconhecido).
 */
export function toastApiError(caught: unknown, fallbackMessage: string): void {
  toast.error(
    caught instanceof Error ? caught.message : fallbackMessage,
  );
}
