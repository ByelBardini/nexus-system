import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { ModalTrocaSenha } from "@/components/ModalTrocaSenha";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

type FormData = z.infer<typeof schema>;

const INDUSTRIAL_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

const PILLARS = [
  {
    icon: "receipt_long",
    title: "Ordens de Serviço",
    desc: "Ciclo completo de OS",
  },
  {
    icon: "devices",
    title: "Equipamentos",
    desc: "Gestão de aparelhos e instalações",
  },
  {
    icon: "engineering",
    title: "Técnicos",
    desc: "Controle de prestadores de serviço e estoque",
  },
] as const;

export function Login() {
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: FormData) {
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

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* ── Left: branding ── */}
      <section
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-slate-900"
        style={{ backgroundImage: INDUSTRIAL_PATTERN }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-900/90 pointer-events-none" />

        {/* Logo + headline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <img
              src="/logo.png"
              alt="Nexus"
              className="w-10 h-10 object-contain"
            />
            <span className="text-white text-2xl font-black tracking-tighter uppercase font-condensed">
              Sistema Nexus
            </span>
          </div>

          <h1 className="text-white text-5xl font-extrabold tracking-tight mb-4 leading-tight font-condensed">
            Controle total da operação
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-md leading-relaxed">
            Ordens de serviço, equipamentos e equipes em um único sistema.
          </p>
        </div>

        {/* Feature pillars */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {PILLARS.map((p) => (
            <div
              key={p.icon}
              className="flex flex-col border-l-2 border-erp-blue/40 pl-4 py-2"
            >
              <MaterialIcon
                name={p.icon}
                className="text-erp-blue text-3xl mb-2"
              />
              <span className="text-white text-sm font-bold uppercase tracking-tight font-condensed">
                {p.title}
              </span>
              <span className="text-slate-500 text-xs font-medium mt-0.5">
                {p.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Right: login form ── */}
      <main className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 md:p-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-12">
          <img src="/logo.png" alt="Nexus" className="w-8 h-8 object-contain" />
          <span className="text-slate-900 text-xl font-black tracking-tighter uppercase font-condensed">
            Sistema Nexus
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight mb-1 font-condensed uppercase">
              Entrar no sistema
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Use suas credenciais corporativas
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">
                  E-mail
                </Label>
                <div className="relative">
                  <MaterialIcon
                    name="account_circle"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    autoComplete="email"
                    className="h-10 pl-9 text-sm"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div>
                <Label htmlFor="password" className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">
                  Senha
                </Label>
                <div className="relative">
                  <MaterialIcon
                    name="lock"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
                  />
                  <Input
                    id="password"
                    type={showSenha ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-10 pl-9 pr-10 text-sm"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showSenha ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-erp-blue hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-wide gap-2 group transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Problemas com acesso?{" "}
                <span className="text-erp-blue font-bold cursor-default">
                  Contate o setor de T.I.
                </span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              © {new Date().getFullYear()} Evolutiva Sistemas
            </span>
          </footer>
        </div>
      </main>

      <ModalTrocaSenha
        open={showTrocaSenha}
        senhaAtual={senhaAtualParaTroca}
        obrigatorio
        onSuccess={handleTrocaSenhaSuccess}
      />
    </div>
  );
}
