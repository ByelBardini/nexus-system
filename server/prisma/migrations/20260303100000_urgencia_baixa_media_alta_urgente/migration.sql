-- AlterEnum: alterar UrgenciaPedido de NORMAL/ALTA para BAIXA/MEDIA/ALTA/URGENTE
-- 1. Expandir enum para incluir novos valores
ALTER TABLE `pedidos_rastreadores` MODIFY COLUMN `urgencia` ENUM('NORMAL', 'ALTA', 'BAIXA', 'MEDIA', 'URGENTE') NOT NULL DEFAULT 'MEDIA';
-- 2. Migrar NORMAL -> MEDIA
UPDATE `pedidos_rastreadores` SET `urgencia` = 'MEDIA' WHERE `urgencia` = 'NORMAL';
-- 3. Remover NORMAL do enum
ALTER TABLE `pedidos_rastreadores` MODIFY COLUMN `urgencia` ENUM('BAIXA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA';
