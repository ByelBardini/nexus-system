# Context — Nexus System

Ver índice em `AGENTS.md`.

### Domínio: `tabelas-config`

Módulo de configuração de tabelas de suporte ao domínio de aparelhos. Atualmente gerencia **Categorias de Falha de Rastreadores**.

**Arquivos do módulo (`server/src/tabelas-config/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `tabelas-config.module.ts` | Registra controller + service; sem importações extras (`PrismaModule` é global) |
| `tabelas-config.controller.ts` | Rotas em `/tabelas-config`; `@UseGuards(PermissionsGuard)` no controller |
| `tabelas-config.service.ts` | CRUD de categorias de falha; soft-delete via `ativo = false` |
| `dto/create-categoria-falha.dto.ts` | `nome: string`, `motivaTexto?: boolean` |
| `dto/update-categoria-falha.dto.ts` | Ambos opcionais |

**Endpoints e permissões:**

| Método | Path | Permissões |
|--------|------|------------|
| GET | `/tabelas-config/categorias-falha` | `CONFIGURACAO.APARELHO.LISTAR` |
| GET | `/tabelas-config/categorias-falha/ativas` | `CONFIGURACAO.APARELHO.LISTAR` |
| POST | `/tabelas-config/categorias-falha` | `CONFIGURACAO.APARELHO.EDITAR` |
| PATCH | `/tabelas-config/categorias-falha/:id` | `CONFIGURACAO.APARELHO.EDITAR` |
| DELETE | `/tabelas-config/categorias-falha/:id` | `CONFIGURACAO.APARELHO.EDITAR` |

> `DELETE` realiza soft-delete (`ativo = false`), não exclusão física.

**Modelo Prisma:**

```prisma
model CategoriaFalhaRastreador {
  id          Int      @id @default(autoincrement())
  nome        String   @unique @db.VarChar(100)
  ativo       Boolean  @default(true)
  motivaTexto Boolean  @default(false) @map("motiva_texto")
  criadoEm   DateTime  @default(now()) @map("criado_em")
  @@map("categorias_falha_rastreador")
}
```

**Regras de negócio:**

- `criarCategoriaFalha` lança `BadRequestException` se já existir um registro com o mesmo `nome` (constraint `@unique` + verificação prévia no service).
- `atualizarCategoriaFalha` lança `NotFoundException` se o id não existir.
- `desativarCategoriaFalha` lança `NotFoundException` se o id não existir; registros inativos persistem no banco.
- Endpoint `ativas` retorna apenas registros com `ativo = true`; usado pelo front-end no fluxo de cadastro individual de aparelhos.

**Seed (`server/prisma/seed.ts`):**

Categorias padrão inseridas via `upsert` (não duplicam em re-runs):

| nome | motivaTexto |
|------|-------------|
| Dano Físico / Carcaça | false |
| Outro | true |

**Testes unitários (`server/test/unit/tabelas-config/`):**

| Arquivo | Cobertura |
|---------|-----------|
| `tabelas-config.service.spec.ts` | `listarCategoriasFalha`, `listarCategoriasFalhaAtivas`, `criarCategoriaFalha` (sucesso + nome duplicado), `atualizarCategoriaFalha` (sucesso + não encontrado), `desativarCategoriaFalha` (sucesso + não encontrado) |
| `tabelas-config.controller.spec.ts` | Delegação controller → service; guard sobrescrito via `.overrideGuard(PermissionsGuard)` |

---

**Front-end (`client/src/pages/tabelas-config/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `TabelasConfigPage.tsx` | Página principal; usa `hasPermission("CONFIGURACAO.APARELHO.EDITAR")` para exibir botões de edição |
| `categorias-falha/useCategoriasFalhaConfig.ts` | React Query + estado do modal (abrir/fechar, criar/editar) |
| `categorias-falha/CategoriasFalhaTable.tsx` | Tabela: Nome, Exige Descrição, Ativo, Ações (editar / desativar) |
| `categorias-falha/CategoriaFalhaModal.tsx` | Dialog com campo `nome` (Input) e `motivaTexto` (Switch) |

**Hook de consumo compartilhado (`client/src/pages/aparelhos/shared/`):**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `useCategoriasFalhaAtivas.ts` | `GET /tabelas-config/categorias-falha/ativas`; queryKey `["tabelas-config","categorias-falha","ativas"]`; tipo retornado: `CategoriaFalhaAtiva { id, nome, motivaTexto }` |

Usado em `DefinicaoStatusSection` do cadastro individual: ao selecionar uma categoria com `motivaTexto === true`, o campo auxiliar `categoriaFalhaMotiva` do formulário é setado como `true`, tornando `motivoDefeito` obrigatório.

**Rota:** `/tabelas` (lazy-loaded em `App.tsx`). Acessível via tile "Tabelas" na `ConfiguracoesPage`.
