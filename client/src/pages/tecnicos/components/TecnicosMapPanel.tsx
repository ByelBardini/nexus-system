import { Suspense, lazy, type Dispatch, type SetStateAction } from "react";
import { Loader2 } from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { nextMapState, type MapState } from "@/lib/tecnicos-page";
import type { Tecnico } from "../lib/tecnicos.types";

const TecnicosMap = lazy(() => import("@/components/TecnicosMap"));

type Props = {
  tecnicos: Tecnico[];
  mapState: MapState;
  onMapStateChange: Dispatch<SetStateAction<MapState>>;
};

export function TecnicosMapPanel({
  tecnicos,
  mapState,
  onMapStateChange,
}: Props) {
  return (
    <section
      className={cn(
        "relative z-0 isolate shrink-0 border-r border-slate-200 bg-slate-100 transition-[width] duration-300",
        mapState === "collapsed" && "w-[40%]",
        mapState === "expanded" && "w-[75%]",
        mapState === "fullscreen" && "fixed inset-0 z-40 w-full border-r-0",
      )}
    >
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        }
      >
        <TecnicosMap tecnicos={tecnicos} containerSize={mapState} />
      </Suspense>
      <div className="absolute right-3 top-3 z-[400] flex flex-row-reverse gap-2">
        <button
          type="button"
          onClick={() => onMapStateChange((s) => nextMapState(s))}
          title={
            mapState === "collapsed"
              ? "Expandir mapa"
              : mapState === "expanded"
                ? "Tela cheia"
                : "Recolher mapa"
          }
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <MaterialIcon
            name={
              mapState === "fullscreen" ? "close_fullscreen" : "open_in_full"
            }
            className="text-base"
          />
        </button>
        {mapState === "expanded" && (
          <button
            type="button"
            onClick={() => {
              onMapStateChange("collapsed");
            }}
            title="Recolher mapa"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <MaterialIcon name="unfold_less" className="text-base" />
          </button>
        )}
      </div>
    </section>
  );
}
