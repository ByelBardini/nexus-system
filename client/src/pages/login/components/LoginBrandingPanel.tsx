import { MaterialIcon } from "@/components/MaterialIcon";
import { INDUSTRIAL_PATTERN, LOGIN_FEATURE_PILLARS } from "../loginConstants";

export function LoginBrandingPanel() {
  return (
    <section
      className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-slate-900"
      style={{ backgroundImage: INDUSTRIAL_PATTERN }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-900/90 pointer-events-none" />

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

      <div className="relative z-10 grid grid-cols-3 gap-6">
        {LOGIN_FEATURE_PILLARS.map((p) => (
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
  );
}
