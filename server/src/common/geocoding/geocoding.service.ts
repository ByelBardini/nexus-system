import { Injectable, Logger } from '@nestjs/common';

export interface EnderecoGeocoding {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  uf?: string | null;
}

export type GeocodingPrecisaoLevel = 'EXATO' | 'CIDADE';

export interface GeocodingResult {
  lat: number;
  lng: number;
  precision: GeocodingPrecisaoLevel;
}

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'NexusSystem/1.0 (contato@nexus-system.local)';
const REQUEST_TIMEOUT_MS = 3000;
const THROTTLE_MS = 1000;

type NominatimItem = { lat: string; lon: string };

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private lastRequestAt = 0;
  private queue: Promise<unknown> = Promise.resolve();

  async geocode(endereco: EnderecoGeocoding): Promise<GeocodingResult | null> {
    const hasFull = this.hasFullAddress(endereco);
    const hasCity = this.hasCityAddress(endereco);

    if (!hasFull && !hasCity) {
      this.logger.debug({
        msg: 'Endereço insuficiente para geocoding',
        endereco,
      });
      return null;
    }

    if (hasFull) {
      const exato = await this.tryQuery(this.buildFullQuery(endereco));
      if (exato) {
        return { ...exato, precision: 'EXATO' };
      }
      this.logger.warn({
        msg: 'Endereço completo não localizado, tentando fallback cidade/UF',
        cidade: endereco.cidade,
        uf: endereco.uf,
      });
    }

    if (!hasCity) {
      this.logger.error({
        msg: 'Geocoding falhou: sem cidade/UF para fallback',
        endereco,
      });
      return null;
    }

    const cidade = await this.tryQuery(this.buildCityQuery(endereco));
    if (cidade) {
      return { ...cidade, precision: 'CIDADE' };
    }

    this.logger.error({
      msg: 'Geocoding falhou em ambas as tentativas',
      cidade: endereco.cidade,
      uf: endereco.uf,
    });
    return null;
  }

  private hasFullAddress(endereco: EnderecoGeocoding): boolean {
    return Boolean(
      endereco.logradouro?.trim() &&
      endereco.cidade?.trim() &&
      endereco.uf?.trim(),
    );
  }

  private hasCityAddress(endereco: EnderecoGeocoding): boolean {
    return Boolean(endereco.cidade?.trim() && endereco.uf?.trim());
  }

  private buildFullQuery(endereco: EnderecoGeocoding): string {
    const parts = [
      endereco.logradouro,
      endereco.numero,
      endereco.bairro,
      endereco.cidade,
      endereco.uf,
      endereco.cep,
      'Brasil',
    ].filter((p): p is string => Boolean(p?.trim()));
    return parts.join(', ');
  }

  private buildCityQuery(endereco: EnderecoGeocoding): string {
    return [endereco.cidade, endereco.uf, 'Brasil']
      .filter((p): p is string => Boolean(p?.trim()))
      .join(', ');
  }

  private async tryQuery(
    query: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const response = await this.enqueue(() => this.fetchNominatim(query));
    if (!response) return null;
    const lat = parseFloat(response.lat);
    const lng = parseFloat(response.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(async () => {
      const now = Date.now();
      const waitMs = Math.max(0, this.lastRequestAt + THROTTLE_MS - now);
      if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
      this.lastRequestAt = Date.now();
      return task();
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async fetchNominatim(query: string): Promise<NominatimItem | null> {
    const url = `${NOMINATIM_ENDPOINT}?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(
      query,
    )}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.warn({
          msg: 'Nominatim retornou status não-OK',
          status: res.status,
          query,
        });
        return null;
      }
      const data = (await res.json()) as NominatimItem[];
      if (!Array.isArray(data) || data.length === 0) return null;
      return data[0];
    } catch (err) {
      this.logger.warn({
        msg: 'Falha ao chamar Nominatim',
        error: err instanceof Error ? err.message : String(err),
        query,
      });
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
