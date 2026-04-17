-- CreateTable
CREATE TABLE `historico_debitos_rastreadores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `debito_id` INTEGER NOT NULL,
    `pedido_id` INTEGER NULL,
    `delta` INTEGER NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historico_debitos_rastreadores_debito_id_idx`(`debito_id`),
    INDEX `historico_debitos_rastreadores_pedido_id_idx`(`pedido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `historico_debitos_rastreadores` ADD CONSTRAINT `historico_debitos_rastreadores_debito_id_fkey` FOREIGN KEY (`debito_id`) REFERENCES `debitos_rastreadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_debitos_rastreadores` ADD CONSTRAINT `historico_debitos_rastreadores_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos_rastreadores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
