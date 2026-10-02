-- Version de sesión por usuario: se incrementa al cambiar o blanquear la
-- contraseña para invalidar todos los JWT emitidos con la versión anterior.
ALTER TABLE "usuarios" ADD COLUMN "versionSesion" INTEGER NOT NULL DEFAULT 1;