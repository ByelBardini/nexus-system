import { Test, TestingModule } from '@nestjs/testing';
import { GeocodingService } from 'src/common/geocoding/geocoding.service';

type FetchMock = jest.Mock<
  Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>,
  [string, RequestInit?]
>;

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  };
}

describe('GeocodingService', () => {
  let service: GeocodingService;
  let fetchMock: FetchMock;

  const enderecoCompleto = {
    logradouro: 'Rua das Flores',
    numero: '123',
    bairro: 'Centro',
    cep: '01001-000',
    cidade: 'São Paulo',
    uf: 'SP',
  };

  beforeEach(async () => {
    fetchMock = jest.fn() as FetchMock;
    (global as unknown as { fetch: FetchMock }).fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [GeocodingService],
    })
      .setLogger(false)
      .compile();

    service = module.get<GeocodingService>(GeocodingService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('geocode com endereço completo', () => {
    it('envia User-Agent e countrycodes=br na query', async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse([{ lat: '-23.55', lon: '-46.63' }]),
      );

      await service.geocode(enderecoCompleto);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('https://nominatim.openstreetmap.org/search');
      expect(url).toContain('countrycodes=br');
      expect(url).toContain('format=json');
      expect(url).toContain('limit=1');
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers['User-Agent']).toMatch(/NexusSystem/);
    });

    it('retorna precision EXATO quando a 1a query resolve', async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse([{ lat: '-23.5505', lon: '-46.6333' }]),
      );

      const result = await service.geocode(enderecoCompleto);

      expect(result).toEqual({
        lat: -23.5505,
        lng: -46.6333,
        precision: 'EXATO',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('cascata de fallback', () => {
    it('cai para cidade/UF quando a 1a query retorna vazio e marca precision CIDADE', async () => {
      fetchMock
        .mockResolvedValueOnce(mockFetchResponse([]))
        .mockResolvedValueOnce(
          mockFetchResponse([{ lat: '-23.55', lon: '-46.63' }]),
        );

      jest.useFakeTimers();
      const promise = service.geocode(enderecoCompleto);
      await jest.advanceTimersByTimeAsync(1100);
      const result = await promise;

      expect(result).toEqual({
        lat: -23.55,
        lng: -46.63,
        precision: 'CIDADE',
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const secondQuery = fetchMock.mock.calls[1][0];
      expect(secondQuery).toContain(encodeURIComponent('São Paulo'));
      expect(secondQuery).toContain('SP');
      expect(secondQuery).not.toContain(encodeURIComponent('Rua das Flores'));
    });

    it('pula direto para query cidade/UF quando endereço não tem logradouro', async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse([{ lat: '-23.55', lon: '-46.63' }]),
      );

      const result = await service.geocode({
        cidade: 'São Paulo',
        uf: 'SP',
      });

      expect(result).toEqual({
        lat: -23.55,
        lng: -46.63,
        precision: 'CIDADE',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('retorna null quando ambas as queries falham', async () => {
      fetchMock
        .mockResolvedValueOnce(mockFetchResponse([]))
        .mockResolvedValueOnce(mockFetchResponse([]));

      jest.useFakeTimers();
      const promise = service.geocode(enderecoCompleto);
      await jest.advanceTimersByTimeAsync(1100);
      const result = await promise;

      expect(result).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('retorna null quando endereço não tem nem cidade nem logradouro', async () => {
      const result = await service.geocode({ cep: '01001-000' });

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('rate limit 1 req/s', () => {
    it('espera pelo menos 1 segundo entre requisições sequenciais', async () => {
      jest.useFakeTimers();
      fetchMock
        .mockResolvedValueOnce(
          mockFetchResponse([{ lat: '-23.55', lon: '-46.63' }]),
        )
        .mockResolvedValueOnce(
          mockFetchResponse([{ lat: '-22.91', lon: '-43.17' }]),
        );

      const p1 = service.geocode(enderecoCompleto);
      const p2 = service.geocode({ cidade: 'Rio de Janeiro', uf: 'RJ' });

      await jest.advanceTimersByTimeAsync(50);
      await p1;

      expect(fetchMock).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1000);
      await p2;

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('tratamento de erros', () => {
    it('retorna null em HTTP 429 sem lançar', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse([], false, 429));

      const result = await service.geocode({ cidade: 'São Paulo', uf: 'SP' });

      expect(result).toBeNull();
    });

    it('retorna null em HTTP 500 sem lançar', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse([], false, 500));

      const result = await service.geocode({ cidade: 'São Paulo', uf: 'SP' });

      expect(result).toBeNull();
    });

    it('retorna null quando fetch rejeita', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network'));

      const result = await service.geocode({ cidade: 'São Paulo', uf: 'SP' });

      expect(result).toBeNull();
    });
  });

  describe('montagem de query e respostas inválidas', () => {
    it('monta q na ordem logradouro→cidade→uf→cep com Brasil e filtra só-espaços', async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse([{ lat: '-23.55', lon: '-46.63' }]),
      );

      await service.geocode({
        logradouro: 'Avenida São João',
        numero: '   ',
        bairro: '   ',
        cep: '01310-100',
        cidade: 'São Paulo',
        uf: 'SP',
      });

      const [url] = fetchMock.mock.calls[0];
      const qMatch = url.match(/[?&]q=([^&]+)/);
      expect(qMatch).not.toBeNull();
      const decoded = decodeURIComponent(qMatch![1]);
      expect(decoded).toBe(
        'Avenida São João, São Paulo, SP, 01310-100, Brasil',
      );
      expect(decoded).toContain('São');
    });

    it('retorna null quando lat/lon não são numéricos', async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse([{ lat: 'abc', lon: '-46.63' }]),
      );

      const result = await service.geocode({ cidade: 'São Paulo', uf: 'SP' });

      expect(result).toBeNull();
    });

    it('retorna null quando json não é array', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse({ foo: 1 }));

      const result = await service.geocode({ cidade: 'São Paulo', uf: 'SP' });

      expect(result).toBeNull();
    });

    it('retorna null com logradouro mas cidade só-espaços sem chamar fetch', async () => {
      const result = await service.geocode({
        logradouro: 'Rua X',
        cidade: '   ',
        uf: 'SP',
      });

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('timeout e fila', () => {
    it('retorna null após timeout do AbortController sem lançar', async () => {
      jest.useFakeTimers();
      fetchMock.mockImplementation((_url, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }
        });
      });

      const promise = service.geocode({ cidade: 'São Paulo', uf: 'SP' });
      await jest.advanceTimersByTimeAsync(3100);
      const result = await promise;

      expect(result).toBeNull();
    });

    it('três geocodes sequenciais respeitam throttle cumulativo', async () => {
      jest.useFakeTimers();
      fetchMock.mockResolvedValue(
        mockFetchResponse([{ lat: '-23.55', lon: '-46.63' }]),
      );

      const p1 = service.geocode({ cidade: 'A', uf: 'SP' });
      const p2 = service.geocode({ cidade: 'B', uf: 'SP' });
      const p3 = service.geocode({ cidade: 'C', uf: 'SP' });

      await jest.advanceTimersByTimeAsync(0);
      await p1;
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1000);
      await p2;
      expect(fetchMock).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(1000);
      await p3;
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('rejeição na primeira requisição não impede a segunda', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(mockFetchResponse([{ lat: '-10', lon: '-20' }]));

      const r1 = await service.geocode({ cidade: 'X', uf: 'SP' });
      const r2 = await service.geocode({ cidade: 'Y', uf: 'RJ' });

      expect(r1).toBeNull();
      expect(r2).toEqual({
        lat: -10,
        lng: -20,
        precision: 'CIDADE',
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
