import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigFormModal } from "./ConfigFormModal";
import type { EquipamentosConfigController } from "../hooks/useEquipamentosConfig";

export function EquipamentosConfigModals({
  c,
}: {
  c: EquipamentosConfigController;
}) {
  const marcasPending = c.createMarcaMutation.isPending || c.updateMarcaMutation.isPending;
  const modelosPending =
    c.createModeloMutation.isPending || c.updateModeloMutation.isPending;
  const operadorasPending =
    c.createOperadoraMutation.isPending || c.updateOperadoraMutation.isPending;
  const marcaSimPending =
    c.createMarcaSimcardMutation.isPending ||
    c.updateMarcaSimcardMutation.isPending;
  const planoPending =
    c.createPlanoSimcardMutation.isPending ||
    c.updatePlanoSimcardMutation.isPending;

  return (
    <>
      <ConfigFormModal
        open={c.modalMarcaOpen}
        title={c.editingMarca ? "Editar Marca" : "Nova Marca"}
        headerIcon="precision_manufacturing"
        onClose={c.closeModalMarca}
        onSave={c.handleSaveMarca}
        savePending={marcasPending}
        saveDisabled={false}
      >
        <div className="p-6">
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Nome da Marca <span className="text-red-500">*</span>
          </Label>
          <Input
            value={c.nomeMarca}
            onChange={(e) => c.setNomeMarca(e.target.value)}
            placeholder="Ex: Teltonika"
            className="h-10"
          />
        </div>
      </ConfigFormModal>

      <ConfigFormModal
        open={c.modalModeloOpen}
        title={c.editingModelo ? "Editar Modelo" : "Novo Modelo"}
        headerIcon="devices"
        onClose={c.closeModalModelo}
        onSave={c.handleSaveModelo}
        savePending={modelosPending}
        saveDisabled={false}
      >
        <div className="p-6 space-y-4">
          {!c.editingModelo && (
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Marca <span className="text-red-500">*</span>
              </Label>
              <Select
                value={c.marcaIdForModelo}
                onValueChange={c.setMarcaIdForModelo}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione uma marca..." />
                </SelectTrigger>
                <SelectContent>
                  {c.marcasAtivas.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {c.editingModelo && (
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Marca
              </Label>
              <div className="h-10 px-3 flex items-center bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-600">
                {c.editingModelo.marca.nome}
              </div>
            </div>
          )}
          <div>
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Nome do Modelo <span className="text-red-500">*</span>
            </Label>
            <Input
              value={c.nomeModelo}
              onChange={(e) => c.setNomeModelo(e.target.value)}
              placeholder="Ex: FMB920"
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Mínimo de caracteres do IMEI
            </Label>
            <Input
              type="number"
              min={1}
              value={c.minCaracteresImeiModelo}
              onChange={(e) => c.setMinCaracteresImeiModelo(e.target.value)}
              placeholder="Ex: 15"
              className="h-10"
            />
          </div>
        </div>
      </ConfigFormModal>

      <ConfigFormModal
        open={c.modalOperadoraOpen}
        title={c.editingOperadora ? "Editar Operadora" : "Nova Operadora"}
        headerIcon="sim_card"
        onClose={c.closeModalOperadora}
        onSave={c.handleSaveOperadora}
        savePending={operadorasPending}
        saveDisabled={false}
      >
        <div className="p-6">
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
            Nome da Operadora <span className="text-red-500">*</span>
          </Label>
          <Input
            value={c.nomeOperadora}
            onChange={(e) => c.setNomeOperadora(e.target.value)}
            placeholder="Ex: Vivo"
            className="h-10"
          />
        </div>
      </ConfigFormModal>

      <ConfigFormModal
        open={c.modalMarcaSimcardOpen}
        title={
          c.editingMarcaSimcard
            ? "Editar Marca de Simcard"
            : "Nova Marca de Simcard"
        }
        headerIcon="sim_card"
        onClose={c.closeModalMarcaSimcard}
        onSave={c.handleSaveMarcaSimcard}
        savePending={marcaSimPending}
        saveDisabled={false}
      >
        <div className="p-6 space-y-4">
          {!c.editingMarcaSimcard && (
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Operadora <span className="text-red-500">*</span>
              </Label>
              <Select
                value={c.operadoraIdMarcaSimcard}
                onValueChange={c.setOperadoraIdMarcaSimcard}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione uma operadora..." />
                </SelectTrigger>
                <SelectContent>
                  {c.operadorasAtivas.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {c.editingMarcaSimcard && (
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Operadora
              </Label>
              <Select
                value={c.operadoraIdMarcaSimcard}
                onValueChange={c.setOperadoraIdMarcaSimcard}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {c.operadorasAtivas.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Nome da Marca <span className="text-red-500">*</span>
            </Label>
            <Input
              value={c.nomeMarcaSimcard}
              onChange={(e) => c.setNomeMarcaSimcard(e.target.value)}
              placeholder="Ex: Getrak, Virtueyes, 1nce"
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Mínimo de caracteres do ICCID
            </Label>
            <Input
              type="number"
              min={1}
              value={c.minCaracteresIccidMarcaSimcard}
              onChange={(e) =>
                c.setMinCaracteresIccidMarcaSimcard(e.target.value)
              }
              placeholder="Ex: 19"
              className="h-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="temPlanos"
              checked={c.temPlanosMarcaSimcard}
              onCheckedChange={(v) => c.setTemPlanosMarcaSimcard(!!v)}
              className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
            />
            <Label
              htmlFor="temPlanos"
              className="text-sm font-medium text-slate-700 cursor-pointer"
            >
              Tem planos (500 MB, 1 GB, etc.)
            </Label>
          </div>
        </div>
      </ConfigFormModal>

      <ConfigFormModal
        open={c.modalPlanoSimcardOpen}
        title={c.editingPlanoSimcard ? "Editar Plano" : "Novo Plano"}
        headerIcon="sim_card"
        onClose={c.closeModalPlanoSimcard}
        onSave={c.handleSavePlanoSimcard}
        savePending={planoPending}
        saveDisabled={false}
      >
        <div className="p-6 space-y-4">
          <div>
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Plano (MB) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              placeholder="Ex: 500, 1024"
              value={c.planoMbPlanoSimcard}
              onChange={(e) => {
                const v = e.target.value;
                c.setPlanoMbPlanoSimcard(
                  v === "" ? "" : Math.max(0, parseInt(v, 10) || 0),
                );
              }}
              className="h-10"
            />
          </div>
        </div>
      </ConfigFormModal>
    </>
  );
}
