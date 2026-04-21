export type MapState = "collapsed" | "expanded" | "fullscreen";

export function nextMapState(s: MapState): MapState {
  if (s === "collapsed") return "expanded";
  if (s === "expanded") return "fullscreen";
  return "collapsed";
}

export function tecnicoPrecoToNum(v: number | string | undefined): number {
  if (v === undefined) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
}
