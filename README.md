# API MD5 con Express

## Uso

```powershell
npm install
npm start
```

Después visita, por ejemplo:

```text
http://localhost:3000/api/hola
```

Respuesta:

```json
{
  "hash": "4d186321c1a7f0f354b297e8914ab240"
}
```

Todo lo que aparezca después de `/api/` se utiliza como texto de entrada. Por
ejemplo, `/api/hola/mundo` genera el MD5 de `hola/mundo`.

> MD5 sirve aquí como identificador, pero no es adecuado para guardar
> contraseñas ni para usos criptográficos de seguridad.
