# mi alacena

Aplicacion web para llevar inventario del hogar: productos, lotes, vencimientos, consumo, carga manual y escaneo de codigo de barras.

## Estado actual

Este proyecto fue migrado desde un `index.html` unico a una estructura separada por archivos:

- `index.html`: estructura principal de la app
- `src/styles`: estilos
- `src/js/modules`: logica separada por area
- `src/js/services`: conexiones externas, como Supabase y Open Food Facts
- `.env`: variables de entorno locales

## Requisitos

Necesitas tener instalado:

- Node.js
- npm

Si no sabes si ya los tienes, en Terminal puedes revisar:

```bash
node -v
npm -v
```

## Primer arranque local

1. Entra a la carpeta del proyecto.
2. Instala las dependencias:

```bash
npm install
```

3. Levanta la app en modo desarrollo:

```bash
npm run dev
```

4. Abre en el navegador la direccion que aparezca en pantalla.
   Suele ser algo como `http://localhost:5173`.

## Variables de entorno

La configuracion de Supabase ya no vive en el codigo.

Se usa este archivo local:

- `.env`

Las variables esperadas son:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

Si alguna vez necesitas recrearlo, usa este archivo como referencia:

- `.env.example`

Importante:

- no subas `.env` a GitHub
- `.gitignore` ya esta preparado para evitarlo

## Build de produccion

Para probar que el proyecto compila:

```bash
npm run build
```

Si sale bien, se genera la carpeta `dist`.

## Flujos principales para probar

Cuando abras la app, conviene validar esto:

1. Login
2. Seleccion o creacion de hogar
3. Carga de inventario
4. Alta manual de producto
5. Edicion de producto
6. Alta de lote
7. Descuento de stock
8. Ajustes: categorias y ubicaciones

## Estructura del proyecto

```text
.
├── index.html
├── package.json
├── .env
├── .env.example
└── src
    ├── js
    │   ├── config.js
    │   ├── main.js
    │   ├── state.js
    │   ├── modules
    │   ├── services
    │   └── utils
    └── styles
        └── main.css
```

## Problemas comunes

### La app queda cargando

- revisa que `.env` exista
- revisa que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` tengan valor
- revisa que el proyecto de Supabase siga activo

### No puedo iniciar el servidor local

- revisa que `npm install` haya terminado sin errores
- prueba cerrar y volver a abrir Terminal
- si el puerto esta ocupado, puedes correr:

```bash
npm run dev -- --port 4174
```

### Login o datos no cargan

- revisa que las credenciales de Supabase sean del proyecto correcto
- revisa las politicas y tablas en Supabase
- si cambiaste de proyecto Supabase, actualiza `.env`

## Siguiente paso recomendado

Subir el proyecto a GitHub y seguir la migracion desde una base ya ordenada.
