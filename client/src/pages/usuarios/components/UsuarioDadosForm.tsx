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
import { SETORES_USUARIO } from "../lib/constants";
import type { FormCreate, FormEdit } from "../lib/schemas";

/**
 * Campos compartilhados entre criar e editar; o formulário de criação inclui
 * `cargoIds`, mas esta seção só toca em nome, email e setor.
 */
type FormSóDados = Pick<FormCreate, "nome" | "email" | "setor" | "ativo">;

export function UsuarioDadosForm({
  form,
}: {
  form: UseFormReturn<FormCreate> | UseFormReturn<FormEdit>;
}) {
  const f = form as UseFormReturn<FormSóDados>;
  return (
    <section>
      <h3 className="text-xs font-bold text-slate-400 uppercase mb-5 flex items-center gap-2">
        <span className="w-2 h-2 bg-erp-blue rounded-full" />
        Dados Cadastrais
      </h3>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
            Nome Completo
          </Label>
          <Input
            {...f.register("nome")}
            placeholder="Ex: Ricardo Cavalcanti"
            className="h-9 text-sm"
          />
          {f.formState.errors.nome && (
            <p className="text-xs text-red-500 mt-1">
              {f.formState.errors.nome.message}
            </p>
          )}
        </div>
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
            Setor
          </Label>
          <Controller
            name="setor"
            control={f.control}
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(v || null)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {SETORES_USUARIO.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
            E-mail Corporativo
          </Label>
          <Input
            type="email"
            {...f.register("email")}
            placeholder="usuario@empresa.com.br"
            className="h-9 text-sm"
          />
          {f.formState.errors.email && (
            <p className="text-xs text-red-500 mt-1">
              {f.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
