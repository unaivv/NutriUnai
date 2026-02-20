# NutriUnai

Aplicación web de planes nutricionales personalizados con IA.

## Configuración del Entorno

1. Copia el archivo de variables de entorno:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` y añade tus variables:
   - `OPENAI_API_KEY`: Tu API key de OpenAI (requerida para el chat nutricional)
   - `JWT_SECRET`: Una cadena segura para autenticación JWT

## Desarrollo Local

Para ejecutar el proyecto en modo desarrollo:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Producción

El proyecto está configurado para despliegue en producción usando PM2. La configuración automática:
- Usa `assetPrefix` solo en producción
- Construye automáticamente antes de iniciar
- Gestiona logs y reinicios automáticos

### Despliegue con PM2

```bash
npm run build
pm2 start ecosystem.config.js
```

## Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Verifica código con Biome
- `npm run format` - Formatea código con Biome
