import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputCEP } from "@/components/InputCEP";
import { InputTelefone } from "@/components/InputTelefone";
import { InputCPFCNPJ } from "@/components/InputCPFCNPJ";
import { SelectUF } from "@/components/SelectUF";
import { SelectCidade } from "@/components/SelectCidade";
import { SubclienteNomeAutocomplete } from "@/components/SubclienteNomeAutocomplete";
import { SelectClienteSearch } from "@/components/SelectClienteSearch";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { EnderecoCEP, UF, Municipio } from "@/hooks/useBrasilAPI";
import type { Cliente, SubclienteFull } from "../ordens-servico-criacao.types";
import type { CriacaoOsFormData } from "../ordens-servico-criacao.schema";
import { cobrancaOptions } from "../ordens-servico-criacao.constants";

type Props = {
  form: UseFormReturn<CriacaoOsFormData>;
  ordemInstalacao: "INFINITY" | "CLIENTE";
  clientes: Cliente[];
  subclientes: SubclienteFull[];
  ufs: UF[];
  municipios: Municipio[];
  onSubclienteAddressFound: (endereco: EnderecoCEP) => void;
};

export function OrdensServicoCriacaoClienteSection({
  form,
  ordemInstalacao,
  clientes,
  subclientes,
  ufs,
  municipios,
  onSubclienteAddressFound,
}: Props) {
  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
        <MaterialIcon
          name="corporate_fare"
          className="text-slate-400 text-lg"
        />
        <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
          Cliente / Associação
        </h2>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <Label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">
            Ordem de Instalação
          </Label>
          <div className="flex justify-center gap-4">
            <Button
              type="button"
              variant={ordemInstalacao === "INFINITY" ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-9 text-[11px] font-bold uppercase",
                ordemInstalacao === "INFINITY" &&
                  "bg-erp-blue hover:bg-blue-700",
              )}
              onClick={() => {
                form.setValue("ordemInstalacao", "INFINITY");
                form.setValue("clienteOrdemId", undefined);
                form.setValue("isNovoSubcliente", true);
                form.setValue("subclienteId", undefined);
              }}
            >
              Infinity
            </Button>
            <Button
              type="button"
              variant={ordemInstalacao === "CLIENTE" ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-9 text-[11px] font-bold uppercase",
                ordemInstalacao === "CLIENTE" &&
                  "bg-erp-blue hover:bg-blue-700",
              )}
              onClick={() => {
                form.setValue("ordemInstalacao", "CLIENTE");
                form.setValue("isNovoSubcliente", true);
                form.setValue("subclienteId", undefined);
              }}
            >
              Cliente
            </Button>
          </div>
          {ordemInstalacao === "CLIENTE" && (
            <div className="mt-4">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Cliente
              </Label>
              <Controller
                name="clienteOrdemId"
                control={form.control}
                render={({ field }) => (
                  <SelectClienteSearch
                    clientes={clientes.map((c) => ({
                      id: c.id,
                      nome: c.nome,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Digite para pesquisar cliente..."
                    className="h-9"
                  />
                )}
              />
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-black text-slate-500 uppercase">
              Dados do Subcliente
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-6">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Nome do Subcliente
              </Label>
              <SubclienteNomeAutocomplete
                subclientes={subclientes}
                value={form.watch("subclienteNome") ?? ""}
                subclienteId={form.watch("subclienteId")}
                isNovoSubcliente={form.watch("isNovoSubcliente")}
                onSelect={(s) => {
                  form.setValue("isNovoSubcliente", false);
                  form.setValue("subclienteId", s.id);
                  form.setValue("subclienteNome", s.nome);
                  form.setValue("subclienteCep", s.cep ?? "");
                  form.setValue("subclienteLogradouro", s.logradouro ?? "");
                  form.setValue("subclienteNumero", s.numero ?? "");
                  form.setValue("subclienteComplemento", s.complemento ?? "");
                  form.setValue("subclienteBairro", s.bairro ?? "");
                  form.setValue("subclienteCidade", s.cidade ?? "");
                  form.setValue("subclienteEstado", s.estado ?? "");
                  form.setValue("subclienteCpf", s.cpf ?? "");
                  form.setValue("subclienteEmail", s.email ?? "");
                  form.setValue("subclienteTelefone", s.telefone ?? "");
                  form.setValue(
                    "subclienteCobranca",
                    (s.cobrancaTipo as "INFINITY" | "CLIENTE") ?? "INFINITY",
                  );
                }}
                onSelectNovo={() => {
                  form.setValue("isNovoSubcliente", true);
                  form.setValue("subclienteId", undefined);
                  form.setValue("subclienteNome", "");
                  form.setValue("subclienteCep", "");
                  form.setValue("subclienteLogradouro", "");
                  form.setValue("subclienteNumero", "");
                  form.setValue("subclienteComplemento", "");
                  form.setValue("subclienteBairro", "");
                  form.setValue("subclienteCidade", "");
                  form.setValue("subclienteEstado", "");
                  form.setValue("subclienteCpf", "");
                  form.setValue("subclienteEmail", "");
                  form.setValue("subclienteTelefone", "");
                }}
                onChange={(nome) => {
                  form.setValue("subclienteNome", nome);
                  if (form.watch("subclienteId")) {
                    form.setValue("subclienteId", undefined);
                    form.setValue("isNovoSubcliente", true);
                  }
                }}
                placeholder="Digite para buscar ou criar novo..."
              />
            </div>

            <div className="col-span-6">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                CEP
              </Label>
              <Controller
                name="subclienteCep"
                control={form.control}
                render={({ field }) => (
                  <InputCEP
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onAddressFound={onSubclienteAddressFound}
                    placeholder="00000-000"
                    className="h-9"
                  />
                )}
              />
            </div>
            <div className="col-span-4">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Logradouro
              </Label>
              <Input
                {...form.register("subclienteLogradouro")}
                placeholder="Rua, Av., etc."
                className="h-9"
                autoComplete="off"
              />
            </div>
            <div className="col-span-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Nº
              </Label>
              <Input
                {...form.register("subclienteNumero")}
                placeholder="Nº"
                className="h-9"
                autoComplete="off"
              />
            </div>
            <div className="col-span-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Compl.
              </Label>
              <Input
                {...form.register("subclienteComplemento")}
                placeholder="Sala, etc."
                className="h-9"
                autoComplete="off"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Bairro
              </Label>
              <Input
                {...form.register("subclienteBairro")}
                placeholder="Bairro"
                className="h-9"
                autoComplete="off"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Estado
              </Label>
              <Controller
                name="subclienteEstado"
                control={form.control}
                render={({ field }) => (
                  <SelectUF
                    ufs={ufs}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="UF"
                    className="h-9"
                  />
                )}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Cidade
              </Label>
              <Controller
                name="subclienteCidade"
                control={form.control}
                render={({ field }) => (
                  <SelectCidade
                    municipios={municipios}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Cidade"
                    className="h-9"
                  />
                )}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                CPF/CNPJ (opcional)
              </Label>
              <Controller
                name="subclienteCpf"
                control={form.control}
                render={({ field }) => (
                  <InputCPFCNPJ
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    className="h-9"
                  />
                )}
              />
              {form.formState.errors.subclienteCpf && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.subclienteCpf.message}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                E-mail (opcional)
              </Label>
              <Input
                {...form.register("subclienteEmail")}
                type="email"
                placeholder="email@exemplo.com"
                className="h-9"
                autoComplete="off"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Telefone
              </Label>
              <Controller
                name="subclienteTelefone"
                control={form.control}
                render={({ field }) => (
                  <InputTelefone
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    className="h-9"
                  />
                )}
              />
            </div>
            {ordemInstalacao === "CLIENTE" && (
              <div className="col-span-6">
                <Label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">
                  Cobrança
                </Label>
                <Controller
                  name="subclienteCobranca"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex justify-center gap-4">
                      {cobrancaOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            field.value === opt.value ? "default" : "outline"
                          }
                          size="sm"
                          className={cn(
                            "h-9 text-[11px] font-bold uppercase",
                            field.value === opt.value &&
                              "bg-erp-blue hover:bg-blue-700",
                          )}
                          onClick={() => field.onChange(opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
