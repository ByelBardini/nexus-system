import { useCallback, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EnderecoCEP } from "@/hooks/useBrasilAPI";
import { useUFs, useMunicipios } from "@/hooks/useBrasilAPI";
import {
  emptyTecnicoFormValues,
  tecnicoFormSchema,
  tecnicoToFormValues,
  type TecnicoFormData,
} from "../lib/tecnico-form";
import type { Tecnico } from "../lib/tecnicos.types";

export function useTecnicoFormModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState<Tecnico | null>(null);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingTecnico(null);
  }, []);

  const form = useForm<TecnicoFormData>({
    resolver: zodResolver(tecnicoFormSchema) as Resolver<TecnicoFormData>,
    defaultValues: emptyTecnicoFormValues(),
    mode: "onChange",
  });

  const estadoAtuacao = form.watch("estado");
  const { data: ufs = [] } = useUFs();
  const { data: municipios = [] } = useMunicipios(estadoAtuacao || null);

  const openCreateModal = useCallback(() => {
    setEditingTecnico(null);
    form.reset(emptyTecnicoFormValues());
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (t: Tecnico) => {
      setEditingTecnico(t);
      form.reset(tecnicoToFormValues(t));
      setModalOpen(true);
    },
    [form],
  );

  const handleAddressFound = useCallback(
    (endereco: EnderecoCEP) => {
      form.setValue("logradouro", endereco.logradouro);
      form.setValue("bairro", endereco.bairro);
      form.setValue("cidadeEndereco", endereco.localidade);
      form.setValue("estadoEndereco", endereco.uf);
      if (endereco.complemento) {
        form.setValue("complemento", endereco.complemento);
      }
    },
    [form],
  );

  const watchedValues = useWatch({
    control: form.control,
    name: [
      "nome",
      "cidade",
      "estado",
      "instalacaoSemBloqueio",
      "revisao",
      "deslocamento",
    ],
  });

  const watchedResumo = {
    nome: watchedValues[0],
    cidade: watchedValues[1],
    estado: watchedValues[2],
    instalacaoSemBloqueio: watchedValues[3],
    revisao: watchedValues[4],
    deslocamento: watchedValues[5],
  };

  return {
    modalOpen,
    setModalOpen,
    editingTecnico,
    closeModal,
    openCreateModal,
    openEditModal,
    form,
    ufs,
    municipios,
    estadoAtuacao,
    handleAddressFound,
    watchedResumo,
  };
}
