-- AlterTable: adicionar MISTO ao enum TipoDestinoPedido
ALTER TABLE `pedidos_rastreadores` MODIFY `tipoDestino` ENUM('TECNICO', 'CLIENTE', 'MISTO') NOT NULL;

-- CreateTable: pedidos_rastreadores_itens
CREATE TABLE `pedidos_rastreadores_itens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedido_rastreador_id` INTEGER NOT NULL,
    `proprietario` ENUM('INFINITY', 'CLIENTE') NOT NULL DEFAULT 'INFINITY',
    `cliente_id` INTEGER NULL,
    `quantidade` INTEGER NOT NULL,
    `marca_equipamento_id` INTEGER NULL,
    `modelo_equipamento_id` INTEGER NULL,
    `operadora_id` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pedidos_rastreadores_itens_pedido_rastreador_id_idx`(`pedido_rastreador_id`),
    INDEX `pedidos_rastreadores_itens_cliente_id_idx`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores_itens` ADD CONSTRAINT `pedidos_rastreadores_itens_pedido_rastreador_id_fkey` FOREIGN KEY (`pedido_rastreador_id`) REFERENCES `pedidos_rastreadores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores_itens` ADD CONSTRAINT `pedidos_rastreadores_itens_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores_itens` ADD CONSTRAINT `pedidos_rastreadores_itens_marca_equipamento_id_fkey` FOREIGN KEY (`marca_equipamento_id`) REFERENCES `marcas_equipamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores_itens` ADD CONSTRAINT `pedidos_rastreadores_itens_modelo_equipamento_id_fkey` FOREIGN KEY (`modelo_equipamento_id`) REFERENCES `modelos_equipamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores_itens` ADD CONSTRAINT `pedidos_rastreadores_itens_operadora_id_fkey` FOREIGN KEY (`operadora_id`) REFERENCES `operadoras`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
