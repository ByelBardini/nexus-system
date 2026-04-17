-- CreateTable: kits
CREATE TABLE `kits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `kits_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: lotes_aparelhos
CREATE TABLE `lotes_aparelhos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `referencia` VARCHAR(100) NOT NULL,
    `nota_fiscal` VARCHAR(50) NULL,
    `data_chegada` DATETIME(3) NOT NULL,
    `tipo` ENUM('RASTREADOR', 'SIM') NOT NULL,
    `proprietario` ENUM('INFINITY', 'CLIENTE') NOT NULL DEFAULT 'INFINITY',
    `cliente_id` INTEGER NULL,
    `marca` VARCHAR(100) NULL,
    `modelo` VARCHAR(100) NULL,
    `operadora` VARCHAR(50) NULL,
    `quantidade` INTEGER NOT NULL,
    `valor_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lotes_aparelhos_cliente_id_idx`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: aparelhos
CREATE TABLE `aparelhos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('RASTREADOR', 'SIM') NOT NULL,
    `identificador` VARCHAR(50) NULL,
    `status` ENUM('EM_ESTOQUE', 'CONFIGURADO', 'DESPACHADO', 'COM_TECNICO', 'INSTALADO') NOT NULL DEFAULT 'EM_ESTOQUE',
    `proprietario` ENUM('INFINITY', 'CLIENTE') NOT NULL DEFAULT 'INFINITY',
    `cliente_id` INTEGER NULL,
    `marca` VARCHAR(100) NULL,
    `modelo` VARCHAR(100) NULL,
    `operadora` VARCHAR(50) NULL,
    `lote_id` INTEGER NULL,
    `valor_unitario` DECIMAL(10, 2) NULL,
    `tecnico_id` INTEGER NULL,
    `kit_id` INTEGER NULL,
    `sim_vinculado_id` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `aparelhos_cliente_id_idx`(`cliente_id`),
    INDEX `aparelhos_lote_id_idx`(`lote_id`),
    INDEX `aparelhos_tecnico_id_idx`(`tecnico_id`),
    INDEX `aparelhos_kit_id_idx`(`kit_id`),
    INDEX `aparelhos_sim_vinculado_id_idx`(`sim_vinculado_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: aparelhos_historico
CREATE TABLE `aparelhos_historico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aparelho_id` INTEGER NOT NULL,
    `status_anterior` ENUM('EM_ESTOQUE', 'CONFIGURADO', 'DESPACHADO', 'COM_TECNICO', 'INSTALADO') NOT NULL,
    `status_novo` ENUM('EM_ESTOQUE', 'CONFIGURADO', 'DESPACHADO', 'COM_TECNICO', 'INSTALADO') NOT NULL,
    `observacao` VARCHAR(500) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `aparelhos_historico_aparelho_id_idx`(`aparelho_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: ordens_servico
CREATE TABLE `ordens_servico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` INTEGER NOT NULL,
    `tipo` ENUM('INSTALACAO_COM_BLOQUEIO', 'INSTALACAO_SEM_BLOQUEIO', 'REVISAO', 'RETIRADA', 'DESLOCAMENTO') NOT NULL,
    `status` ENUM('AGENDADO', 'EM_TESTES', 'TESTES_REALIZADOS', 'AGUARDANDO_CADASTRO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'AGENDADO',
    `cliente_id` INTEGER NOT NULL,
    `subcliente_id` INTEGER NULL,
    `veiculo_id` INTEGER NULL,
    `tecnico_id` INTEGER NULL,
    `criado_por_id` INTEGER NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ordens_servico_numero_key`(`numero`),
    INDEX `ordens_servico_cliente_id_fkey`(`cliente_id`),
    INDEX `ordens_servico_subcliente_id_fkey`(`subcliente_id`),
    INDEX `ordens_servico_veiculo_id_fkey`(`veiculo_id`),
    INDEX `ordens_servico_tecnico_id_fkey`(`tecnico_id`),
    INDEX `ordens_servico_criado_por_id_fkey`(`criado_por_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: os_historico
CREATE TABLE `os_historico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ordem_servico_id` INTEGER NOT NULL,
    `status_anterior` ENUM('AGENDADO', 'EM_TESTES', 'TESTES_REALIZADOS', 'AGUARDANDO_CADASTRO', 'FINALIZADO', 'CANCELADO') NOT NULL,
    `status_novo` ENUM('AGENDADO', 'EM_TESTES', 'TESTES_REALIZADOS', 'AGUARDANDO_CADASTRO', 'FINALIZADO', 'CANCELADO') NOT NULL,
    `observacao` VARCHAR(500) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `os_historico_ordem_servico_id_fkey`(`ordem_servico_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lotes_aparelhos` ADD CONSTRAINT `lotes_aparelhos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aparelhos` ADD CONSTRAINT `aparelhos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aparelhos` ADD CONSTRAINT `aparelhos_lote_id_fkey` FOREIGN KEY (`lote_id`) REFERENCES `lotes_aparelhos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aparelhos` ADD CONSTRAINT `aparelhos_tecnico_id_fkey` FOREIGN KEY (`tecnico_id`) REFERENCES `tecnicos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aparelhos` ADD CONSTRAINT `aparelhos_kit_id_fkey` FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aparelhos` ADD CONSTRAINT `aparelhos_sim_vinculado_id_fkey` FOREIGN KEY (`sim_vinculado_id`) REFERENCES `aparelhos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aparelhos_historico` ADD CONSTRAINT `aparelhos_historico_aparelho_id_fkey` FOREIGN KEY (`aparelho_id`) REFERENCES `aparelhos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_subcliente_id_fkey` FOREIGN KEY (`subcliente_id`) REFERENCES `subclientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_veiculo_id_fkey` FOREIGN KEY (`veiculo_id`) REFERENCES `veiculos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_tecnico_id_fkey` FOREIGN KEY (`tecnico_id`) REFERENCES `tecnicos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_criado_por_id_fkey` FOREIGN KEY (`criado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `os_historico` ADD CONSTRAINT `os_historico_ordem_servico_id_fkey` FOREIGN KEY (`ordem_servico_id`) REFERENCES `ordens_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
