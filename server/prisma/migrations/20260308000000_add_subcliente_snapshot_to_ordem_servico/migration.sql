-- Snapshot do subcliente na ordem de serviço (preserva dados no momento da criação)
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_nome` VARCHAR(200) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_logradouro` VARCHAR(255) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_numero` VARCHAR(20) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_complemento` VARCHAR(100) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_bairro` VARCHAR(100) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_cidade` VARCHAR(100) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_estado` VARCHAR(2) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_cep` VARCHAR(10) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_cpf` VARCHAR(20) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_email` VARCHAR(255) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_telefone` VARCHAR(20) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `subcliente_snapshot_cobranca_tipo` VARCHAR(20) NULL;
