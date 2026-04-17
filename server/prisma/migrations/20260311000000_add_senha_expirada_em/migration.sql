-- Add senhaExpiradaEm to usuarios (null = first login or expired)
ALTER TABLE `usuarios` ADD COLUMN `senha_expirada_em` DATETIME(3) NULL;
