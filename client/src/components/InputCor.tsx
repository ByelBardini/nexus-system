import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#a16207",
];

interface InputCorProps {
  value?: string;
  onChange: (cor: string | undefined) => void;
}

export function InputCor({ value, onChange }: InputCorProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(value ?? "");
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function commitHexInput(raw: string) {
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      onChange(normalized);
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
          open
            ? "border-slate-400 bg-white"
            : "border-slate-200 bg-white hover:border-slate-300",
        )}
      >
        {value ? (
          <>
            <span
              className="h-4 w-4 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono text-[11px] text-slate-600 uppercase">
              {value}
            </span>
          </>
        ) : (
          <>
            <span className="h-4 w-4 rounded-full border border-dashed border-slate-300 shrink-0" />
            <span className="text-slate-400">Escolher cor</span>
          </>
        )}
        <svg
          className={cn(
            "ml-1 h-3 w-3 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          {/* react-colorful picker */}
          <div className="[&_.react-colorful]:w-full [&_.react-colorful]:rounded-md [&_.react-colorful\_\_saturation]:rounded-t-md [&_.react-colorful\_\_last-control]:rounded-b-md [&_.react-colorful\_\_pointer]:h-4 [&_.react-colorful\_\_pointer]:w-4 [&_.react-colorful\_\_pointer]:border-2 [&_.react-colorful\_\_hue]:mt-2 [&_.react-colorful\_\_hue]:h-3 [&_.react-colorful\_\_hue]:rounded-full">
            <HexColorPicker
              color={value ?? "#3b82f6"}
              onChange={(hex) => {
                onChange(hex);
                setHexInput(hex);
              }}
            />
          </div>

          {/* Hex input */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">#</span>
            <input
              className="flex-1 rounded-md border border-slate-200 px-2 py-1 font-mono text-xs uppercase text-slate-700 focus:border-slate-400 focus:outline-none"
              value={hexInput.replace(/^#/, "")}
              maxLength={6}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={(e) => commitHexInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitHexInput(hexInput);
              }}
              placeholder="3b82f6"
            />
            {value && (
              <span
                className="h-6 w-6 shrink-0 rounded border border-black/10"
                style={{ backgroundColor: value }}
              />
            )}
          </div>

          {/* Palette rápida */}
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase text-slate-400">
              Cores rápidas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => {
                    onChange(hex);
                    setHexInput(hex);
                  }}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                    value === hex ? "border-slate-700 scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Remover */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setHexInput("");
              }}
              className="mt-3 w-full rounded-md border border-dashed border-slate-200 py-1 text-[11px] text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors"
            >
              Remover cor
            </button>
          )}
        </div>
      )}
    </div>
  );
}
