import {
  buildDebitoRastreadorFindInclude,
  debitoRastreadorClienteMarcaModeloInclude,
} from 'src/debitos-rastreadores/debito-rastreador.include';

describe('debito-rastreador.include', () => {
  it('expõe include base com cliente, marca e modelo', () => {
    expect(debitoRastreadorClienteMarcaModeloInclude).toMatchObject({
      devedorCliente: { select: { id: true, nome: true } },
      credorCliente: { select: { id: true, nome: true } },
      marca: { select: { id: true, nome: true } },
      modelo: { select: { id: true, nome: true } },
    });
    expect(debitoRastreadorClienteMarcaModeloInclude).not.toHaveProperty(
      'historicos',
    );
  });

  it('buildDebitoRastreadorFindInclude(false) não inclui historicos', () => {
    const inc = buildDebitoRastreadorFindInclude(false);
    expect(inc).toMatchObject(debitoRastreadorClienteMarcaModeloInclude);
    expect(inc).not.toHaveProperty('historicos');
  });

  it('buildDebitoRastreadorFindInclude(true) inclui historicos com relações', () => {
    const inc = buildDebitoRastreadorFindInclude(true);
    expect(inc.historicos).toMatchObject({
      orderBy: { criadoEm: 'asc' },
      include: expect.objectContaining({
        pedido: { select: { id: true, codigo: true } },
        ordemServico: { select: { id: true, numero: true } },
      }),
    });
  });
});
