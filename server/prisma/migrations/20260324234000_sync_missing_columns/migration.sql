-- Sync columns that exist in schema.prisma but were never added via migrations

-- AlterTable: usuarios
ALTER TABLE `usuarios`
  ADD COLUMN `setor` ENUM('AGENDAMENTO', 'CONFIGURACAO', 'ADMINISTRATIVO') NULL,
  ADD COLUMN `ultimo_acesso` DATETIME(3) NULL;

-- AlterTable: clientes
ALTER TABLE `clientes`
  ADD COLUMN `nome_fantasia` VARCHAR(200) NULL,
  ADD COLUMN `tipo_contrato` ENUM('COMODATO', 'AQUISICAO') NOT NULL DEFAULT 'COMODATO',
  ADD COLUMN `estoque_proprio` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `status` ENUM('ATIVO', 'PENDENTE', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
  ADD COLUMN `cep` VARCHAR(10) NULL,
  ADD COLUMN `logradouro` VARCHAR(255) NULL,
  ADD COLUMN `numero` VARCHAR(20) NULL,
  ADD COLUMN `complemento` VARCHAR(100) NULL,
  ADD COLUMN `bairro` VARCHAR(100) NULL,
  ADD COLUMN `cidade` VARCHAR(100) NULL,
  ADD COLUMN `estado` VARCHAR(2) NULL;

-- AlterTable: tecnicos
ALTER TABLE `tecnicos`
  ADD COLUMN `cpf_cnpj` VARCHAR(20) NULL,
  ADD COLUMN `cep` VARCHAR(10) NULL,
  ADD COLUMN `logradouro` VARCHAR(255) NULL,
  ADD COLUMN `numero` VARCHAR(20) NULL,
  ADD COLUMN `complemento` VARCHAR(100) NULL,
  ADD COLUMN `bairro` VARCHAR(100) NULL,
  ADD COLUMN `cidade_endereco` VARCHAR(100) NULL,
  ADD COLUMN `estado_endereco` VARCHAR(2) NULL;
