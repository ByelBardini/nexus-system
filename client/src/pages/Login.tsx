import { ModalTrocaSenha } from "@/components/ModalTrocaSenha";
import { LoginBrandingPanel } from "./login/components/LoginBrandingPanel";
import { LoginFormColumn } from "./login/components/LoginFormColumn";
import { useLoginPage } from "./login/hooks/useLoginPage";

export function Login() {
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    loading,
    showSenha,
    setShowSenha,
    showTrocaSenha,
    senhaAtualParaTroca,
    handleTrocaSenhaSuccess,
  } = useLoginPage();

  return (
    <div className="flex min-h-screen overflow-hidden">
      <LoginBrandingPanel />

      <LoginFormColumn
        register={register}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        errors={errors}
        loading={loading}
        showPassword={showSenha}
        onTogglePassword={() => setShowSenha((s) => !s)}
      />

      <ModalTrocaSenha
        open={showTrocaSenha}
        senhaAtual={senhaAtualParaTroca}
        obrigatorio
        onSuccess={handleTrocaSenhaSuccess}
      />
    </div>
  );
}
