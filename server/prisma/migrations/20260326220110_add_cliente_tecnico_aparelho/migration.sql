/*
  Warnings:

  - You are about to drop the column `endereco_entrega` on the `tecnicos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `cargos` DROP FOREIGN KEY `Role_sector_id_fkey`;

-- DropForeignKey
ALTER TABLE `cargos_permissoes` DROP FOREIGN KEY `role_permissions_permission_id_fkey`;

-- DropForeignKey
ALTER TABLE `cargos_permissoes` DROP FOREIGN KEY `role_permissions_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `precos_tecnicos` DROP FOREIGN KEY `TecnicoPreco_tecnico_id_fkey`;

-- DropForeignKey
ALTER TABLE `subclientes` DROP FOREIGN KEY `Subcliente_cliente_id_fkey`;

-- DropForeignKey
ALTER TABLE `usuarios_cargos` DROP FOREIGN KEY `user_roles_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `usuarios_cargos` DROP FOREIGN KEY `user_roles_user_id_fkey`;

-- AlterTable
ALTER TABLE `kits` MODIFY `kit_concluido` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `pedidos_rastreadores` ALTER COLUMN `atualizado_em` DROP DEFAULT;

-- AlterTable
ALTER TABLE `tecnicos` DROP COLUMN `endereco_entrega`;

-- CreateTable
CREATE TABLE `pedidos_rastreadores_aparelhos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedido_rastreador_id` INTEGER NOT NULL,
    `aparelho_id` INTEGER NOT NULL,
    `destinatario_proprietario` ENUM('INFINITY', 'CLIENTE') NOT NULL,
    `destinatario_cliente_id` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `pedidos_rastreadores_aparelhos_pedido_rastreador_id_idx`(`pedido_rastreador_id`),
    INDEX `pedidos_rastreadores_aparelhos_aparelho_id_idx`(`aparelho_id`),
    UNIQUE INDEX `pedidos_rastreadores_aparelhos_pedido_rastreador_id_aparelho_key`(`pedido_rastreador_id`, `aparelho_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `debitos_rastreadores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `devedor_tipo` ENUM('INFINITY', 'CLIENTE') NOT NULL,
    `devedor_cliente_id` INTEGER NULL,
    `credor_tipo` ENUM('INFINITY', 'CLIENTE') NOT NULL,
    `credor_cliente_id` INTEGER NULL,
    `marca_id` INTEGER NOT NULL,
    `modelo_id` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `debitos_rastreadores_devedor_cliente_id_idx`(`devedor_cliente_id`),
    INDEX `debitos_rastreadores_credor_cliente_id_idx`(`credor_cliente_id`),
    INDEX `debitos_rastreadores_marca_id_idx`(`marca_id`),
    INDEX `debitos_rastreadores_modelo_id_idx`(`modelo_id`),
    UNIQUE INDEX `debitos_rastreadores_devedor_tipo_devedor_cliente_id_credor__key`(`devedor_tipo`, `devedor_cliente_id`, `credor_tipo`, `credor_cliente_id`, `marca_id`, `modelo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `pedidos_rastreadores_data_solicitacao_idx` ON `pedidos_rastreadores`(`data_solicitacao`);

-- AddForeignKey
ALTER TABLE `cargos` ADD CONSTRAINT `cargos_sector_id_fkey` FOREIGN KEY (`sector_id`) REFERENCES `setores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cargos_permissoes` ADD CONSTRAINT `cargos_permissoes_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cargos_permissoes` ADD CONSTRAINT `cargos_permissoes_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `cargos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_cargos` ADD CONSTRAINT `usuarios_cargos_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `cargos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_cargos` ADD CONSTRAINT `usuarios_cargos_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subclientes` ADD CONSTRAINT `subclientes_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `precos_tecnicos` ADD CONSTRAINT `precos_tecnicos_tecnico_id_fkey` FOREIGN KEY (`tecnico_id`) REFERENCES `tecnicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores_aparelhos` ADD CONSTRAINT `pedidos_rastreadores_aparelhos_pedido_rastreador_id_fkey` FOREIGN KEY (`pedido_rastreador_id`) REFERENCES `pedidos_rastreadores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores_aparelhos` ADD CONSTRAINT `pedidos_rastreadores_aparelhos_aparelho_id_fkey` FOREIGN KEY (`aparelho_id`) REFERENCES `aparelhos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores_aparelhos` ADD CONSTRAINT `pedidos_rastreadores_aparelhos_destinatario_cliente_id_fkey` FOREIGN KEY (`destinatario_cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debitos_rastreadores` ADD CONSTRAINT `debitos_rastreadores_devedor_cliente_id_fkey` FOREIGN KEY (`devedor_cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debitos_rastreadores` ADD CONSTRAINT `debitos_rastreadores_credor_cliente_id_fkey` FOREIGN KEY (`credor_cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debitos_rastreadores` ADD CONSTRAINT `debitos_rastreadores_marca_id_fkey` FOREIGN KEY (`marca_id`) REFERENCES `marcas_equipamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `debitos_rastreadores` ADD CONSTRAINT `debitos_rastreadores_modelo_id_fkey` FOREIGN KEY (`modelo_id`) REFERENCES `modelos_equipamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `cargos` RENAME INDEX `Role_sector_id_code_key` TO `cargos_sector_id_code_key`;

-- RenameIndex
ALTER TABLE `pedidos_rastreadores` RENAME INDEX `pedidos_rastreadores_cliente_id_fkey` TO `pedidos_rastreadores_cliente_id_idx`;

-- RenameIndex
ALTER TABLE `pedidos_rastreadores` RENAME INDEX `pedidos_rastreadores_de_cliente_id_fkey` TO `pedidos_rastreadores_de_cliente_id_idx`;

-- RenameIndex
ALTER TABLE `pedidos_rastreadores` RENAME INDEX `pedidos_rastreadores_marca_equipamento_id_fkey` TO `pedidos_rastreadores_marca_equipamento_id_idx`;

-- RenameIndex
ALTER TABLE `pedidos_rastreadores` RENAME INDEX `pedidos_rastreadores_modelo_equipamento_id_fkey` TO `pedidos_rastreadores_modelo_equipamento_id_idx`;

-- RenameIndex
ALTER TABLE `pedidos_rastreadores` RENAME INDEX `pedidos_rastreadores_operadora_id_fkey` TO `pedidos_rastreadores_operadora_id_idx`;

-- RenameIndex
ALTER TABLE `permissoes` RENAME INDEX `Permission_code_key` TO `permissoes_code_key`;

-- RenameIndex
ALTER TABLE `precos_tecnicos` RENAME INDEX `TecnicoPreco_tecnico_id_key` TO `precos_tecnicos_tecnico_id_key`;

-- RenameIndex
ALTER TABLE `setores` RENAME INDEX `Sector_code_key` TO `setores_code_key`;

-- RenameIndex
ALTER TABLE `usuarios` RENAME INDEX `User_email_key` TO `usuarios_email_key`;

-- RenameIndex
ALTER TABLE `veiculos` RENAME INDEX `Veiculo_placa_key` TO `veiculos_placa_key`;
