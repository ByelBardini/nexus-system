const METERS_PER_DEG_LAT = 111_320;

export function coordKey(lat: number, lng: number): string {
  return `${Math.round(lat * 1e6)}_${Math.round(lng * 1e6)}`;
}

export function groupPlotsByCoordinate<
  T extends { id: number; lat: number; lng: number },
>(items: T[]): Map<string, T[]> {
  const byKey = new Map<string, T[]>();
  for (const item of items) {
    const k = coordKey(item.lat, item.lng);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(item);
  }
  for (const arr of byKey.values()) {
    arr.sort((a, b) => a.id - b.id);
  }
  return byKey;
}

/**
 * Desloca levemente itens que compartilham o mesmo par lat/lng (ex.: geocoding só por cidade)
 * em um círculo, para os pins não ficarem empilhados. As coordenadas reais permanecem em `lat`/`lng`.
 */
export function spreadDuplicateMapCoordinates<T extends { id: number; lat: number; lng: number }>(
  items: T[],
  radiusMeters = 48,
): Array<T & { displayLat: number; displayLng: number }> {
  const byKey = groupPlotsByCoordinate(items);
  const out: Array<T & { displayLat: number; displayLng: number }> = [];

  for (const [, group] of byKey) {
    if (group.length === 1) {
      const p = group[0];
      out.push({ ...p, displayLat: p.lat, displayLng: p.lng });
      continue;
    }

    const lat0 = group[0].lat;
    const lng0 = group[0].lng;
    const cosLat = Math.cos((lat0 * Math.PI) / 180);
    const denomLng = METERS_PER_DEG_LAT * Math.max(0.15, Math.abs(cosLat));
    const n = group.length;

    group.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const northM = radiusMeters * Math.cos(angle);
      const eastM = radiusMeters * Math.sin(angle);
      const dLat = northM / METERS_PER_DEG_LAT;
      const dLng = eastM / denomLng;
      out.push({
        ...p,
        displayLat: lat0 + dLat,
        displayLng: lng0 + dLng,
      });
    });
  }

  return out;
}
