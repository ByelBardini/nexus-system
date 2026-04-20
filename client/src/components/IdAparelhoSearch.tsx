import { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const BLUR_DELAY_MS = 150;

export function IdAparelhoSearch({
  rastreadores,
  value,
  onChange,
  placeholder,
}: {
  rastreadores: { id: number; identificador?: string | null }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
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
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return rastreadores.slice(0, 20);
    const term = searchTerm.toLowerCase();
    return rastreadores.filter((a) =>
      (a.identificador ?? "").toLowerCase().includes(term),
    );
  }, [rastreadores, searchTerm]);

  const displayValue = isOpen ? searchTerm : value;

  useEffect(() => {
    if (!isOpen) setSearchTerm(value);
  }, [isOpen, value]);

  function handleFocus() {
    setIsOpen(true);
    setSearchTerm(value);
  }

  function handleBlur() {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;
      setIsOpen(false);
      const trimmed = searchTerm.trim();
      if (trimmed) onChange(trimmed);
    }, BLUR_DELAY_MS);
  }

  function handleSelect(id: string) {
    setSearchTerm(id);
    onChange(id);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        className="h-9 pr-9"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
      />
      <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[100] max-h-60 overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              minWidth: 200,
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {value && (
              <button
                type="button"
                className="w-full cursor-pointer px-3 py-2 text-left text-[11px] text-slate-500 hover:bg-accent"
                onMouseDown={() => {
                  onChange("");
                  setSearchTerm("");
                }}
              >
                Limpar
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[11px] text-slate-500">
                Nenhum rastreador instalado na lista. Digite o ID manualmente.
              </div>
            ) : (
              filtered.map((a) => {
                const id = (a.identificador ?? "").trim();
                if (!id) return null;
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={cn(
                      "w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      value === id && "bg-accent",
                    )}
                    onMouseDown={() => handleSelect(id)}
                  >
                    {id}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
