import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { loginFormSchema, type LoginFormData } from "@/types/login";

export function useLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [showTrocaSenha, setShowTrocaSenha] = useState(false);
  const [senhaAtualParaTroca, setSenhaAtualParaTroca] = useState("");

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    try {
      const res = await login(data.email, data.password);
      toast.success("Login realizado com sucesso");
      if (res.exigeTrocaSenha) {
        setSenhaAtualParaTroca(data.password);
        setShowTrocaSenha(true);
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  function handleTrocaSenhaSuccess() {
    setShowTrocaSenha(false);
    setSenhaAtualParaTroca("");
    navigate(from, { replace: true });
  }

  return {
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
  };
}
