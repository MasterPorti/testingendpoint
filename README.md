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

## Historial temporal

Puedes consultar las últimas 100 peticiones que recuerde el proceso actual en:

```text
http://localhost:3000/api/historial
```

Este historial vive solamente en memoria. En plataformas serverless como Vercel
puede desaparecer en cualquier momento y puede estar incompleto si Vercel utiliza
varias instancias. Cada petición también se escribe en los Runtime Logs de Vercel.

Cada entrada incluye la IP informada por el proxy, tipo de dispositivo, sistema
operativo, navegador, plataforma, idioma y User-Agent. Estos datos se deducen de
las cabeceras de la petición y pueden estar incompletos o ser falsificados.

No uses el endpoint público de historial para recibir información privada. La IP
y el User-Agent pueden considerarse datos personales.

> MD5 sirve aquí como identificador, pero no es adecuado para guardar
> contraseñas ni para usos criptográficos de seguridad.
