-- CreateTable: marcas_equipamentos (requerido por pedidos_rastreadores)
CREATE TABLE `marcas_equipamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `marcas_equipamentos_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: operadoras (requerido por pedidos_rastreadores)
CREATE TABLE `operadoras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `operadoras_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: modelos_equipamentos (requerido por pedidos_rastreadores)
CREATE TABLE `modelos_equipamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `marca_id` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `modelos_equipamentos_marca_id_nome_key`(`marca_id`, `nome`),
    INDEX `modelos_equipamentos_marca_id_idx`(`marca_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `modelos_equipamentos` ADD CONSTRAINT `modelos_equipamentos_marca_id_fkey` FOREIGN KEY (`marca_id`) REFERENCES `marcas_equipamentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: pedidos_rastreadores (estrutura inicial, antes das migrations de alteração)
CREATE TABLE `pedidos_rastreadores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `tipo_destino` ENUM('TECNICO', 'CLIENTE') NOT NULL,
    `tecnico_id` INTEGER NULL,
    `subcliente_id` INTEGER NULL,
    `quantidade` INTEGER NOT NULL,
    `status` ENUM('SOLICITADO', 'EM_CONFIGURACAO', 'CONFIGURADO', 'DESPACHADO', 'ENTREGUE') NOT NULL DEFAULT 'SOLICITADO',
    `urgencia` ENUM('NORMAL', 'ALTA') NOT NULL DEFAULT 'NORMAL',
    `data_previsao` DATETIME(3) NULL,
    `criado_por_id` INTEGER NULL,
    `observacao` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `entregue_em` DATETIME(3) NULL,

    UNIQUE INDEX `pedidos_rastreadores_codigo_key`(`codigo`),
    INDEX `pedidos_rastreadores_tecnico_id_idx`(`tecnico_id`),
    INDEX `pedidos_rastreadores_subcliente_id_idx`(`subcliente_id`),
    INDEX `pedidos_rastreadores_criado_por_id_idx`(`criado_por_id`),
    INDEX `pedidos_rastreadores_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: pedidos_rastreadores_historico
CREATE TABLE `pedidos_rastreadores_historico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedido_rastreador_id` INTEGER NOT NULL,
    `status_anterior` ENUM('SOLICITADO', 'EM_CONFIGURACAO', 'CONFIGURADO', 'DESPACHADO', 'ENTREGUE') NOT NULL,
    `status_novo` ENUM('SOLICITADO', 'EM_CONFIGURACAO', 'CONFIGURADO', 'DESPACHADO', 'ENTREGUE') NOT NULL,
    `observacao` VARCHAR(500) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pedidos_rastreadores_historico_pedido_rastreador_id_idx`(`pedido_rastreador_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores` ADD CONSTRAINT `pedidos_rastreadores_tecnico_id_fkey` FOREIGN KEY (`tecnico_id`) REFERENCES `tecnicos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores` ADD CONSTRAINT `pedidos_rastreadores_subcliente_id_fkey` FOREIGN KEY (`subcliente_id`) REFERENCES `subclientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores` ADD CONSTRAINT `pedidos_rastreadores_criado_por_id_fkey` FOREIGN KEY (`criado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores_historico` ADD CONSTRAINT `pedidos_rastreadores_historico_pedido_rastreador_id_fkey` FOREIGN KEY (`pedido_rastreador_id`) REFERENCES `pedidos_rastreadores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
