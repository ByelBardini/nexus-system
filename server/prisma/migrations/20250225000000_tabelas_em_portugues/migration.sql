-- Rename tables to Portuguese names

-- First rename tables that have FKs pointing to them (parent tables)
-- order: Permission, Sector, User, Role, then junction tables
RENAME TABLE `Permission` TO `permissoes`;
RENAME TABLE `Sector` TO `setores`;
RENAME TABLE `User` TO `usuarios`;
RENAME TABLE `Role` TO `cargos`;

-- Rename junction tables (FKs are automatically updated by MySQL)
RENAME TABLE `role_permissions` TO `cargos_permissoes`;
RENAME TABLE `user_roles` TO `usuarios_cargos`;

-- Rename remaining tables
RENAME TABLE `audit_log` TO `registros_auditoria`;
RENAME TABLE `Cliente` TO `clientes`;
RENAME TABLE `Subcliente` TO `subclientes`;
RENAME TABLE `Tecnico` TO `tecnicos`;
RENAME TABLE `TecnicoPreco` TO `precos_tecnicos`;
RENAME TABLE `Veiculo` TO `veiculos`;
