-- AlterTable
ALTER TABLE `aparelhos` MODIFY `status` ENUM('EM_ESTOQUE', 'CONFIGURADO', 'DESPACHADO', 'COM_TECNICO', 'INSTALADO', 'DESCARTADO') NOT NULL DEFAULT 'EM_ESTOQUE';

-- AlterTable
ALTER TABLE `aparelhos_historico` MODIFY `status_anterior` ENUM('EM_ESTOQUE', 'CONFIGURADO', 'DESPACHADO', 'COM_TECNICO', 'INSTALADO', 'DESCARTADO') NOT NULL,
    MODIFY `status_novo` ENUM('EM_ESTOQUE', 'CONFIGURADO', 'DESPACHADO', 'COM_TECNICO', 'INSTALADO', 'DESCARTADO') NOT NULL;

-- CreateTable
CREATE TABLE `categorias_falha_rastreador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `motiva_texto` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `categorias_falha_rastreador_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
