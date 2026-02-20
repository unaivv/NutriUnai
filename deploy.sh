#!/bin/bash

# Script de despliegue para producción en Raspberry Pi con PM2

echo "🚀 Iniciando despliegue de NutriUnai..."

# Detener la aplicación actual
echo "📦 Deteniendo aplicación actual..."
pm2 stop nutriunai || echo "⚠️  La aplicación no estaba corriendo"
pm2 delete nutriunai || echo "⚠️  No existía el proceso"

# Limpiar logs antiguos
echo "🧹 Limpiando logs antiguos..."
pm2 flush nutriunai || echo "⚠️  No había logs que limpiar"

# Crear directorio de logs si no existe
mkdir -p logs

# Verificar variables de entorno
echo "🔍 Verificando variables de entorno..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  Creando .env.local desde .env..."
    cp .env .env.local
fi

# Instalar dependencias
echo "📚 Instalando dependencias..."
npm ci --production

# Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Verificar que la construcción fue exitosa
if [ $? -ne 0 ]; then
    echo "❌ Error en la construcción. Abortando despliegue."
    exit 1
fi

# Iniciar la aplicación con PM2
echo "🎯 Iniciando aplicación con PM2..."
pm2 start ecosystem.config.js

# Esperar un momento y verificar estado
sleep 3
echo "📊 Estado de la aplicación:"
pm2 status

# Mostrar logs si hay errores
if pm2 jlist | grep -q '"status":"errored"'; then
    echo "❌ La aplicación tiene errores. Mostrando logs:"
    pm2 logs nutriunai --err --lines 20
fi

# Guardar configuración de PM2
pm2 save

echo "✅ Despliegue completado!"
echo "📋 Logs disponibles con: pm2 logs nutriunai"
echo "🔄 Reiniciar con: pm2 restart nutriunai"
echo "🛑 Detener con: pm2 stop nutriunai"
