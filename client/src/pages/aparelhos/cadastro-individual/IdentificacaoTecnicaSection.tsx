import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type {
  MarcaCatalog,
  MarcaModeloCatalog,
  MarcaSimcardRow,
  OperadoraCatalog,
} from "@/pages/aparelhos/shared/catalog.types";
import type { FormDataCadastroIndividual } from "./schema";

type IdentificacaoTecnicaSectionProps = {
  form: UseFormReturn<FormDataCadastroIndividual>;
  watchTipo: "RASTREADOR" | "SIM";
  watchMarca: string;
  watchOperadora: string;
  watchIdentificador: string;
  idJaExiste: { identificador: string; lote?: { referencia: string } | null } | null;
  idValido: boolean;
  marcasAtivas: MarcaCatalog[];
  modelosDisponiveis: MarcaModeloCatalog[];
  operadorasAtivas: OperadoraCatalog[];
  marcasSimcardFiltradas: MarcaSimcardRow[];
};

export function IdentificacaoTecnicaSection({
  form,
  watchTipo,
  watchMarca,
  watchOperadora,
  watchIdentificador,
  idJaExiste,
  idValido,
  marcasAtivas,
  modelosDisponiveis,
  operadorasAtivas,
  marcasSimcardFiltradas,
}: IdentificacaoTecnicaSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
        <MaterialIcon name="qr_code_scanner" className="text-erp-blue" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Identificação Técnica
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            {watchTipo === "RASTREADOR" ? "IMEI" : "ICCID"} / Número de Série{" "}
            <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="identificador"
            control={form.control}
            render={({ field }) => (
              <div className="relative">
                <Input
                  {...field}
                  placeholder="Digite o identificador único..."
                  className={cn(
                    "h-9 pr-10 font-mono",
                    idJaExiste &&
                      "border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500",
                    !idJaExiste &&
                      idValido &&
                      watchIdentificador.trim() &&
                      "border-emerald-500 bg-emerald-50 focus:ring-emerald-500 focus:border-emerald-500",
                  )}
                />
                {idJaExiste && (
                  <MaterialIcon
                    name="error"
                    className="absolute right-3 top-2.5 text-red-500"
                  />
                )}
                {!idJaExiste && idValido && watchIdentificador.trim() && (
                  <MaterialIcon
                    name="check_circle"
                    className="absolute right-3 top-2.5 text-emerald-500"
                  />
                )}
              </div>
            )}
          />
          {idJaExiste && (
            <p className="text-[10px] text-red-600 mt-1 font-bold uppercase">
              Atenção: Este {watchTipo === "RASTREADOR" ? "IMEI" : "ICCID"} já
              consta no sistema
              {idJaExiste.lote &&
                ` (Vinculado ao Lote ${idJaExiste.lote.referencia})`}
            </p>
          )}
          {!idJaExiste && !idValido && watchIdentificador.trim() && (
            <p className="text-[10px] text-amber-600 mt-1 font-bold uppercase">
              O{" "}
              {watchTipo === "RASTREADOR"
                ? "IMEI deve ter 15 dígitos"
                : "ICCID deve ter 19-20 dígitos"}
            </p>
          )}
        </div>

        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Tipo de Equipamento
          </Label>
          <Controller
            name="tipo"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  if (v === "SIM") {
                    form.setValue("marca", "");
                    form.setValue("modelo", "");
                    form.setValue("proprietario", "INFINITY");
                    form.setValue("clienteId", null);
                  } else {
                    form.setValue("operadora", "");
                    form.setValue("marcaSimcardId", "");
                    form.setValue("planoSimcardId", "");
                  }
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RASTREADOR">Rastreador</SelectItem>
                  <SelectItem value="SIM">Simcard</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {watchTipo === "RASTREADOR" ? (
          <div>
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Marca e Modelo <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Controller
                name="marca"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("modelo", "");
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9",
                        fieldState.error && "border-red-500",
                      )}
                    >
                      <SelectValue placeholder="Marca..." />
                    </SelectTrigger>
                    <SelectContent>
                      {marcasAtivas.map((m) => (
                        <SelectItem key={m.id} value={m.nome}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Controller
                name="modelo"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!watchMarca}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9",
                        fieldState.error && "border-red-500",
                      )}
                    >
                      <SelectValue
                        placeholder={
                          watchMarca ? "Modelo..." : "Selecione marca"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {modelosDisponiveis.map((m) => (
                        <SelectItem key={m.id} value={m.nome}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Operadora <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="operadora"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("marcaSimcardId", "");
                      form.setValue("planoSimcardId", "");
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {operadorasAtivas.map((o) => (
                        <SelectItem key={o.id} value={o.nome}>
                          {o.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Marca do Simcard
              </Label>
              <Controller
                name="marcaSimcardId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("planoSimcardId", "");
                    }}
                    disabled={!watchOperadora}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue
                        placeholder={
                          watchOperadora
                            ? "Ex: Getrak, 1nce..."
                            : "Selecione operadora"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {marcasSimcardFiltradas.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {form.watch("marcaSimcardId") &&
              (() => {
                const marcaSel = marcasSimcardFiltradas.find(
                  (m) => String(m.id) === form.watch("marcaSimcardId"),
                );
                const planos = (marcaSel?.planos ?? []).filter((p) => p.ativo);
                return marcaSel?.temPlanos && planos.length > 0 ? (
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                      Plano
                    </Label>
                    <Controller
                      name="planoSimcardId"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione o plano..." />
                          </SelectTrigger>
                          <SelectContent>
                            {planos.map((p) => (
                              <SelectItem
                                key={p.id}
                                value={String(p.id)}
                              >
                                {p.planoMb} MB
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                ) : null;
              })()}
          </div>
        )}
      </div>
    </div>
  );
}
