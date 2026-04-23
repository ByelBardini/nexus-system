import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  getDefaultNovoPedidoRastreadorFormValues,
  schemaNovoPedido,
  type FormNovoPedido,
} from "../novo-pedido-rastreador.schema";
import { buildNovoPedidoRastreadorPostJson } from "../novo-pedido-rastreador.payload";
import {
  buildOpcoesClienteFromList,
  formatCidadeEstadoDoDestinatario,
  formatFilialClienteDoSubcliente,
  parseDestinoClienteString,
  resolveDestinatarioSelecionado,
} from "../novo-pedido-rastreador.utils";
import {
  useModelosFiltradosParaMarca,
  useNovoPedidoRastreadorCatalogs,
} from "./useNovoPedidoRastreadorCatalogs";

type UseNovoPedidoRastreadorFormOptions = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

function getFreshDefaultValues(): FormNovoPedido {
  return getDefaultNovoPedidoRastreadorFormValues(
    new Date().toISOString().slice(0, 10),
  );
}

export function useNovoPedidoRastreadorForm({
  open,
  onOpenChange,
  onSuccess,
}: UseNovoPedidoRastreadorFormOptions) {
  const queryClient = useQueryClient();

  const {
    tecnicos,
    loadingTecnicos,
    clientes,
    loadingClientes,
    marcas,
    operadoras,
    modelosRaw,
  } = useNovoPedidoRastreadorCatalogs(open);

  const form = useForm<FormNovoPedido>({
    resolver: zodResolver(schemaNovoPedido),
    defaultValues: getFreshDefaultValues(),
  });

  const {
    fields: itensMistoFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "itensMisto",
  });

  useEffect(() => {
    if (open) {
      form.reset(getFreshDefaultValues());
    }
  }, [open, form]);

  const tipoDestino = form.watch("tipoDestino");
  const tecnicoId = form.watch("tecnicoId");
  const destinoCliente = form.watch("destinoCliente");
  const deCliente = form.watch("deCliente");
  const marcaModeloEspecifico = form.watch("marcaModeloEspecifico");
  const marcaEquipamentoId = form.watch("marcaEquipamentoId");
  const operadoraEspecifica = form.watch("operadoraEspecifica");
  const quantidade = form.watch("quantidade");
  const itensMistoValues = form.watch("itensMisto");

  const { clienteId, subclienteId } = useMemo(
    () => parseDestinoClienteString(destinoCliente),
    [destinoCliente],
  );

  const opcoesCliente = useMemo(
    () => buildOpcoesClienteFromList(clientes),
    [clientes],
  );

  const destinatarioSelecionado = useMemo(
    () =>
      resolveDestinatarioSelecionado({
        tipoDestino,
        tecnicoId,
        clienteId,
        subclienteId,
        tecnicos,
        clientes,
        opcoesCliente,
      }),
    [
      tipoDestino,
      tecnicoId,
      clienteId,
      subclienteId,
      tecnicos,
      clientes,
      opcoesCliente,
    ],
  );

  const modelosFiltrados = useModelosFiltradosParaMarca(
    modelosRaw,
    marcaEquipamentoId,
  );

  const cidadeDisplay = useMemo(
    () => formatCidadeEstadoDoDestinatario(destinatarioSelecionado),
    [destinatarioSelecionado],
  );

  const filialDisplay = useMemo(
    () => formatFilialClienteDoSubcliente(destinatarioSelecionado),
    [destinatarioSelecionado],
  );

  const createMutation = useMutation({
    mutationFn: (data: FormNovoPedido) => {
      const body = buildNovoPedidoRastreadorPostJson(data);
      return api("/pedidos-rastreadores", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos-rastreadores"] });
      form.reset(getFreshDefaultValues());
      onOpenChange(false);
      onSuccess();
      toast.success("Pedido criado com sucesso");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar pedido"),
  });

  function handleClose() {
    form.reset(getFreshDefaultValues());
    onOpenChange(false);
  }

  function onSubmit(data: FormNovoPedido) {
    createMutation.mutate(data);
  }

  return {
    form,
    itensMistoFields,
    appendItem,
    removeItem,
    tecnicos,
    loadingTecnicos,
    clientes,
    loadingClientes,
    marcas,
    operadoras,
    modelosRaw,
    modelosFiltrados,
    tipoDestino,
    tecnicoId,
    destinoCliente,
    deCliente,
    marcaModeloEspecifico,
    marcaEquipamentoId,
    operadoraEspecifica,
    quantidade,
    itensMistoValues,
    opcoesCliente,
    destinatarioSelecionado,
    cidadeDisplay,
    filialDisplay,
    createMutation,
    handleClose,
    onSubmit,
  };
}
