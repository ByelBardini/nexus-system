import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useForm,
  useFieldArray,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { EnderecoCEP } from "@/hooks/useBrasilAPI";
import { useUFs, useMunicipios } from "@/hooks/useBrasilAPI";
import {
  CLIENTES_LISTA_QUERY_KEY,
  CLIENTES_QUERY_KEY,
} from "../hooks/useClientesPageList";
import {
  buildClienteApiBody,
  clienteFormSchema,
  clienteToFormValues,
  getDefaultClienteFormValues,
  type Cliente,
  type ClienteFormData,
} from "../shared/clientes-page.shared";

export type UseClienteModalOptions = {
  open: boolean;
  editingCliente: Cliente | null;
  onClose: () => void;
};

export function useClienteModal({
  open,
  editingCliente,
  onClose,
}: UseClienteModalOptions) {
  const queryClient = useQueryClient();
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: getDefaultClienteFormValues(),
  });

  const lastResetKey = useRef<string | null>(null);

  const resetKey =
    open === false
      ? null
      : editingCliente
        ? `edit-${editingCliente.id}`
        : "create";

  useEffect(() => {
    if (!open || resetKey === null) return;
    if (lastResetKey.current === resetKey) return;
    lastResetKey.current = resetKey;
    if (editingCliente) {
      form.reset(clienteToFormValues(editingCliente));
    } else {
      form.reset(getDefaultClienteFormValues());
    }
  }, [open, resetKey, editingCliente, form.reset]);

  useEffect(() => {
    if (!open) {
      lastResetKey.current = null;
    }
  }, [open]);

  const estadoEndereco = form.watch("estado");
  const { data: ufs = [] } = useUFs();
  const { data: municipios = [] } = useMunicipios(estadoEndereco || null);

  const handleAddressFound = useCallback(
    (endereco: EnderecoCEP) => {
      form.setValue("logradouro", endereco.logradouro);
      form.setValue("bairro", endereco.bairro);
      form.setValue("cidade", endereco.localidade);
      form.setValue("estado", endereco.uf);
      if (endereco.complemento)
        form.setValue("complemento", endereco.complemento);
    },
    [form],
  );

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contatos",
  });

  const invalidateClientes = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CLIENTES_LISTA_QUERY_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data: ClienteFormData) =>
      api("/clientes", {
        method: "POST",
        body: JSON.stringify(buildClienteApiBody(data, "create")),
      }),
    onSuccess: () => {
      invalidateClientes();
      onClose();
      toast.success("Cliente criado com sucesso");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar cliente"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClienteFormData }) =>
      api(`/clientes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(buildClienteApiBody(data, "update")),
      }),
    onSuccess: () => {
      invalidateClientes();
      onClose();
      toast.success("Cliente atualizado com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar cliente",
      ),
  });

  function handleSubmit(data: ClienteFormData) {
    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function addContato() {
    append({ nome: "", celular: "", email: "" });
  }

  const resumoForm: ClienteFormData =
    (useWatch({ control: form.control }) as ClienteFormData | undefined) ??
    getDefaultClienteFormValues();
  const resumoTipoContrato = resumoForm.tipoContrato ?? "COMODATO";

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return {
    form: form as UseFormReturn<ClienteFormData>,
    ufs,
    municipios,
    handleAddressFound,
    fields,
    append,
    remove,
    handleSubmit,
    addContato,
    resumoForm,
    resumoTipoContrato,
    isSubmitting,
  };
}
