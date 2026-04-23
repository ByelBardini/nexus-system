export function extrairKitIds(val: unknown): number[] {
  if (val == null) return [];
  let arr: unknown;
  if (typeof val === 'string') {
    try {
      arr = JSON.parse(val) as unknown;
    } catch {
      return [];
    }
  } else {
    arr = val;
  }
  return Array.isArray(arr)
    ? arr.filter((x): x is number => typeof x === 'number')
    : [];
}
