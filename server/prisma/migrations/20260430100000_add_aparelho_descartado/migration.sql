-- CreateTable
CREATE TABLE `aparelhos_descartados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aparelho_origem_id` INTEGER NULL,
    `tipo` ENUM('RASTREADOR', 'SIM') NOT NULL,
    `identificador` VARCHAR(50) NULL,
    `proprietario` ENUM('INFINITY', 'CLIENTE') NOT NULL,
    `marca` VARCHAR(100) NULL,
    `modelo` VARCHAR(100) NULL,
    `operadora` VARCHAR(50) NULL,
    `marca_simcard_id` INTEGER NULL,
    `plano_simcard_id` INTEGER NULL,
    `lote_id` INTEGER NULL,
    `valor_unitario` DECIMAL(10, 2) NULL,
    `tecnico_id` INTEGER NULL,
    `kit_id` INTEGER NULL,
    `sim_vinculado_id` INTEGER NULL,
    `cliente_id` INTEGER NULL,
    `subcliente_id` INTEGER NULL,
    `veiculo_id` INTEGER NULL,
    `observacao` VARCHAR(500) NULL,
    `criado_em` DATETIME(3) NOT NULL,
    `categoria_falha` VARCHAR(200) NULL,
    `motivo_defeito` VARCHAR(500) NULL,
    `responsavel` VARCHAR(200) NULL,
    `descartado_em` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
