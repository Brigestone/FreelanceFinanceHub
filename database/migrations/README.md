# Migraciones

Los cambios de estructura posteriores a la instalación inicial **no** se hacen editando y reimportando `schema.sql` (que es destructivo). Se hacen con archivos incrementales en esta carpeta.

## Convención

- Nombre: `NNN_descripcion_corta.sql` (ej. `001_add_token_version_to_users.sql`).
- Solo sentencias no destructivas o con respaldo previo (`ALTER TABLE ... ADD COLUMN`, `CREATE INDEX`, etc.).
- Sin sentencia `USE`: aplicar a cada base por separado.
- Al crear una migración, actualizar también `schema.sql` para que las instalaciones nuevas queden iguales.

## Aplicar (PowerShell)

```powershell
cmd /c "C:\xampp\mysql\bin\mysql.exe -u root freelancefinancehub < database\migrations\001_ejemplo.sql"
cmd /c "C:\xampp\mysql\bin\mysql.exe -u root freelancefinancehub_test < database\migrations\001_ejemplo.sql"
```

> PowerShell no admite la redirección `<`; por eso se usa `cmd /c`.

Por ahora no hay migraciones pendientes.
