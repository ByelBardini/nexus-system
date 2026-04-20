import { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TecnicoOption {
  id: number;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
}

interface SelectTecnicoSearchProps {
  tecnicos: TecnicoOption[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  subclienteCidade?: string;
  subclienteEstado?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getProximityScore(
  t: TecnicoOption,
  subCidade: string | undefined,
  subEstado: string | undefined,
): number {
  const cidade = t.cidade ? normalize(t.cidade) : "";
  const estado = t.estado ? t.estado.toUpperCase() : "";
  const subC = subCidade ? normalize(subCidade) : "";
  const subE = subEstado ? subEstado.toUpperCase() : "";

  if (subC && subE && cidade === subC && estado === subE) return 3;
  if (subE && estado === subE) return 2;
  return 1;
}

export function SelectTecnicoSearch({
  tecnicos,
  value,
  onChange,
  subclienteCidade,
  subclienteEstado,
  disabled,
  placeholder = "Digite para pesquisar técnico...",
  className,
}: SelectTecnicoSearchProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    position: "fixed" as "fixed" | "absolute",
  });

  const tecnicoSelecionado = tecnicos.find((t) => t.id === value);

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dialog = containerRef.current.closest('[role="dialog"]');
      if (dialog) {
        const dialogRect = dialog.getBoundingClientRect();
        setDropdownStyle({
          top: rect.bottom - dialogRect.top + 4,
          left: rect.left - dialogRect.left,
          width: rect.width,
          position: "absolute",
        });
      } else {
        setDropdownStyle({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          position: "fixed",
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const el = e.target as Node;
      if (
        containerRef.current?.contains(el) ||
        dropdownRef.current?.contains(el)
      )
        return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredAndSorted = useMemo(() => {
    let list = tecnicos;
    if (subclienteEstado?.trim()) {
      const uf = subclienteEstado.trim().toUpperCase();
      list = list.filter((t) => (t.estado ?? "").toUpperCase() === uf);
    }
    const filtered = searchTerm.trim()
      ? list.filter((t) => {
          const term = searchTerm.toLowerCase();
          const nomeMatch = t.nome.toLowerCase().includes(term);
          const cidadeMatch = t.cidade?.toLowerCase().includes(term);
          const estadoMatch = t.estado?.toUpperCase().includes(term);
          return nomeMatch || cidadeMatch || estadoMatch;
        })
      : list;

    return [...filtered].sort((a, b) => {
      const scoreA = getProximityScore(a, subclienteCidade, subclienteEstado);
      const scoreB = getProximityScore(b, subclienteCidade, subclienteEstado);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (a.nome ?? "").localeCompare(b.nome ?? "");
    });
  }, [tecnicos, searchTerm, subclienteCidade, subclienteEstado]);

  const displayValue = isOpen ? searchTerm : getDisplayText(tecnicoSelecionado);

  useEffect(() => {
    if (!isOpen) setSearchTerm("");
  }, [isOpen]);

  function getDisplayText(t?: TecnicoOption | null) {
    if (!t) return "";
    const loc =
      t.cidade && t.estado
        ? `${t.cidade} - ${t.estado}`
        : (t.cidade ?? t.estado ?? "");
    return loc ? `${t.nome} (${loc})` : t.nome;
  }

  function handleFocus() {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm("");
  }

  function handleSelect(t: TecnicoOption) {
    onChange(t.id);
    setIsOpen(false);
  }

  function handleClear() {
    onChange(undefined);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "Enter" && isOpen && filteredAndSorted.length > 0) {
      e.preventDefault();
      handleSelect(filteredAndSorted[0]);
    }
  }

  if (disabled) {
    return (
      <div
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground",
          className,
        )}
      >
        <span className={tecnicoSelecionado ? "text-foreground" : ""}>
          {tecnicoSelecionado
            ? getDisplayText(tecnicoSelecionado)
            : placeholder}
        </span>
      </div>
    );
  }

  const portalContainer =
    (typeof document !== "undefined" &&
      containerRef.current?.closest('[role="dialog"]')) ||
    document?.body;

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        className={cn("h-9 pr-9 w-full", className)}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {isOpen &&
        portalContainer &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[9999] max-h-60 overflow-y-auto overflow-x-hidden overscroll-contain rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
            style={{
              position: dropdownStyle.position,
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              minWidth: 200,
            }}
          >
            {value && (
              <button
                type="button"
                className="w-full cursor-pointer px-3 py-2 text-left text-[11px] text-slate-500 hover:bg-accent"
                onClick={() => handleClear()}
              >
                Limpar seleção
              </button>
            )}
            {filteredAndSorted.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 outline-none transition-colors hover:border-erp-blue hover:bg-erp-blue/5 hover:text-erp-blue"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    navigate("/tecnicos");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar novo técnico
                </button>
                <p className="mt-2 text-[11px] text-slate-500">
                  Nenhum técnico encontrado. Cadastre um novo técnico.
                </p>
              </div>
            ) : (
              <>
                {filteredAndSorted.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cn(
                      "w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      value === t.id && "bg-accent",
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(t);
                    }}
                  >
                    <span className="font-medium">{t.nome}</span>
                    {t.cidade && t.estado && (
                      <span className="ml-1.5 text-slate-500 text-[11px]">
                        {t.cidade} - {t.estado}
                      </span>
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-slate-500 hover:bg-accent hover:text-slate-700"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      navigate("/tecnicos");
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Cadastrar novo técnico
                  </button>
                </div>
              </>
            )}
          </div>,
          portalContainer,
        )}
    </div>
  );
}
