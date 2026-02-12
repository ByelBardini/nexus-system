# Plano para Programação

## 1) Stack (Front e Back)

### Backend (estrutura forte e escalável sem virar microserviço)

- **Node.js + TypeScript**
- **NestJS** (módulos, guards, DTO, validação, organização)
- **Prisma + MySQL**
    - created_at, updated_at nas entidades principais.
    Índices nos filtros reais: status, created_at, tecnico_id, cliente_id, placa.
- Auth:
    - **JWT (access)** + **refresh token** (pode ser em cookie httpOnly)
- Validação:
    - `class-validator` + DTOs
- Logs/auditoria:
    - tabela `audit_log` + logger (pino/winston)
- Upload/import:
    - CSV import (mais pra frente) via job simples
- Swagger/OpenAPI desde o começo na definição das rotas

> Se você insistir em Express, dá, mas você vai perder tempo criando disciplina estrutural que o Nest já te dá pronto.
> 

### Frontend (rápido de entregar e fácil de manter)

- **React + Vite + TypeScript**
- **TailwindCSS**
- **React Router**
- **TanStack Query** (cache + requests)
- **React Hook Form + Zod** (forms decentes)
- UI: **shadcn/ui** (tabelas, dialog, select, toast)

### Dev/Infra (MVP)

- `.env.example` bem organizado
- Migrations Prisma

---

## 2) Estrutura do banco (MVP já preparado pra crescer)

### 2.1 Core (plataforma)

**users**

- id, nome, email (unique), senha_hash, ativo, created_at

**sectors**

- id, code (`AGENDAMENTO`, `CONFIG`), nome

**roles**

- id, sector_id, code (`SUPERVISOR`, `CADASTRO_OS`, etc.), nome

**permissions**

- id, code (unique)
    
    Ex.: `AGENDAMENTO.OS.CRIAR`
    

**role_permissions**

- role_id, permission_id

**user_roles**

- user_id, role_id

**audit_log** (altamente recomendado)

- id, user_id, action, entity, entity_id, created_at, payload_json

---

### 2.2 Agendamento

**tecnicos**

- id, nome, telefone, endereco_entrega, cidade, estado, ativo
- precos: instalacao_com_bloqueio, instalacao_sem_bloqueio, revisao, retirada, deslocamento

**clientes** (associações)

- id, nome, cnpj?, contato?

**subclientes** (beneficiário)

- id, cliente_id, nome, cep, cidade, estado, cpf?, email?, telefone
- cobranca_tipo (`INFINITY`|`CLIENTE`)

**veiculos**

- id, placa, marca, modelo, ano, cor

**ordens_servico**

- id
- numero_sequencial (unique)
- data_emissao
- criado_por_user_id
- cliente_id, subcliente_id, tecnico_id, veiculo_id
- tipo_servico (`INSTALACAO`|`REVISAO`|`RETIRADA`)
- status (`AGENDADO`|`EM_TESTES`|`TESTES_REALIZADOS`|`AGUARDANDO_CADASTRO`|`FINALIZADO`|`CANCELADO`)
- observacao
- campos extras (pra revisão/retirada): aparelho_id_informado?, local_instalacao?, pos_chave?

**ordem_status_historico**

- id, ordem_id, de_status, para_status, user_id, created_at, observacao?

**servico_realizado**

- id, ordem_id (unique se for 1:1)
- data_execucao
- resultado_tipo (campos de revisão/retirada/instalação)
- observacao

> **Crítica útil:** número sequencial você precisa gerar com segurança (no banco). Não inventa no backend “pegando o último + 1” sem transação.
> 

---

### 2.3 Configuração / Estoque / Pedido

**lotes_entrada**

- id, referencia_manual, data_chegada
- pertence_a (`INFINITY`|`CLIENTE`) + cliente_id?
- tipo (`RASTREADOR`|`SIMCARD`)
- marca_modelo ou operadora
- quantidade
- ids_definidos (bool)
- valor_unitario, valor_total
- status (`NOVO`|`USADO`|`CANCELADO_ENTRADA`)

**equipamentos**

- id, imei_ou_uuid (unique), marca, modelo
- pertence_a (`INFINITY`|`CLIENTE`) + cliente_id?
- status (`DISPONIVEL`|`RESERVADO`|`EM_TESTE`|`VINCULADO`|`INATIVACAO_SOLICITADA`|`CANCELADO`|`DEFEITO`)
- lote_entrada_id, created_at

**simcards**

- id, iccid (unique), operadora
- pertence_a (`INFINITY`|`CLIENTE`) + cliente_id?
- status (mesma ideia do equipamento)
- lote_entrada_id

**kits**

- id, equipamento_id, simcard_id (pode ser null em caso especial), status, created_at

**inativacoes**

- id, tipo (`EQUIPAMENTO`|`SIMCARD`|`KIT`)
- referencia_id
- motivo (`APARELHO_ANTIGO`|`DEFEITO`)
- defeito_desc?, identificacao?
- status (`SOLICITADA`|`CANCELADA`|`CONCLUIDA`)
- datas (solicitacao/cancelamento)

**pedidos_aparelhos**

- id, data_solicitacao
- destino_tipo (`TECNICO`|`CLIENTE`), destino_id
- quantidade, observacao
- status (`ABERTO`|`CONFIGURADO`|`DESPACHADO`|`ENTREGUE`|`CANCELADO`)

**lotes_despache**

- id, referencia
- nf_numero (obrigatório)
- termo_link (obrigatório)
- meio_entrega (`CORREIOS`|`TRANSPORTADORA`)
- codigo_rastreio? (obrigatório se correios)
- created_at, data_despache?

**despache_itens**

- id, lote_despache_id, pedido_id, kit_id (ou equipamento_id/simcard_id), created_at

---

## 3) Funções necessárias (MVP com dois setores)

### Agendamento

- **Supervisor Agendamento**
    - tudo do setor, inclusive corrigir status/cancelar
- **Cadastro OS**
    - cria/edita OS, seleciona técnico/cliente/veículo
- **Execução (Revisão/Retirada/Instalação)**
    - preenche “Serviço Realizado”, move status até “Aguardando cadastro”
- **Testes (opcional no MVP)**
    - gerencia fila “Em Testes”

### Configuração

- **Supervisor Configuração**
    - tudo do setor, incluindo cancelamentos/defeitos
- **Estoque**
    - lotes, equipamentos, simcards, inativações
- **Montagem de Kit**
    - monta kit, reserva itens
- **Despache**
    - NF + termo + envio + entregue
- **Vinculação/Cadastro final**
    - pega OS/termo “Aguardando cadastro” e conclui

> Importante: Supervisor **não precisa ser um campo especial**. É só uma role com permissões amplas.
> 

---

# 4) Páginas por ordem de construção

A ideia aqui é: **primeiro o “esqueleto” (login, permissões, cadastros-base)**, depois o **fluxo real**.

## 4.1 Páginas iniciais (as primeiras que você vai programar)

1. **Login**
- autenticação + guardar token/cookie
1. **Home (vazia, só menu + atalhos)**
- base do layout
1. **Usuários**
- listar/criar/editar usuário
1. **Cargos/Funções (Roles) + Permissões**
- tela simples para atribuir funções ao usuário (por setor)
1. **Cadastros base**
- **Clientes/Associações** (CRUD)
- **Técnicos** (CRUD com tabela de preços)

> Se você pular “Usuários/Funções” e fizer depois, você vai reescrever metade das rotas porque tudo vira “admin faz tudo”.
> 

---

## 4.2 Páginas secundárias (onde começam as funções de fato)

### Agendamento

1. **Ordem de Serviço — Criar**
- formulário completo (cliente/subcliente/técnico/veículo/tipo)
1. **Ordem de Serviço — Listagem**
- filtros por status, técnico, cliente, placa, período
1. **Ordem de Serviço — Detalhe**
- visão completa + histórico de status
1. **Serviço Realizado**
- selecionar OS e preencher execução → mudar status

### Configuração

1. **Entrada de Lote (Novo/Usado)**
- opção “IDs definidos” + colar lista
1. **Estoque**
- lista equipamentos/simcards + status + filtros
1. **Montagem de Kit (Individual)**
- selecionar equipamento + simcard → gerar kit (status reservado/disponível)

---

## 4.3 Páginas terciárias (o resto das telas do fluxo)

### Agendamento

1. **Em Testes (Kanban/lista central)**
- cards com técnico/placa/cliente
- botão “iniciar teste / concluir teste”
1. **Tela de Subcliente (Beneficiário)**
- CRUD completo + busca/auto preencher (se você quiser depois)

### Configuração / Pedido / Despache

1. **Pedido de aparelhos**
- abrir pedido (quantidade/destino)
1. **Despache**
- selecionar lote + pedido
- NF + termo + envio + rastreio (se correios)
1. **Vinculação (fila Aguardando cadastro)**
- lista separada do que precisa cadastrar
- concluir → OS vai pra FINALIZADO
1. **Inativação**
- solicitar e concluir cancelamento/defeito

---

## 4.4 Páginas finais (opcionais / depois do MVP)

1. **Dashboard**
- cards por período + gráficos (mês padrão)
1. **Relatórios**
- filtros + export CSV/XLSX
1. **Auditoria (audit log viewer)**
- quem alterou status, quem cadastrou lote, etc.
1. **Importação CSV (Kit em massa)**
- só depois do fluxo individual estar sólido
1. **Integrações**
- WhatsApp/termo/placa (plugar com o que vocês já têm)

---

# 5) Ordem de implementação (roteiro direto)

Se eu fosse colocar isso em sequência “pra começar amanhã”:

1. Stack + projeto base + Docker MySQL
2. Core: Users + Roles/Permissions + Login
3. Cadastros: Clientes + Técnicos
4. Ordem de Serviço: criar/listar/detalhe + histórico
5. Serviço Realizado + transições de status
6. Estoque: lote + equipamentos + simcards
7. Kit individual
8. Pedido + despache
9. Vinculação
10. Dashboard/Relatórios/CSV (depois)