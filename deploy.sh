#!/bin/bash

# Script de despliegue para producción en Raspberry Pi con PM2

echo "🚀 Iniciando despliegue de NutriUnai..."

# Detener la aplicación actual
echo "📦 Deteniendo aplicación actual..."
pm2 stop nutriunai || echo "⚠️  La aplicación no estaba corriendo"
pm2 delete nutriunai || echo "⚠️  No existía el proceso"

# Instalar dependencias
echo "📚 Instalando dependencias..."
npm ci --production

# Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Iniciar la aplicación con PM2
echo "🎯 Iniciando aplicación con PM2..."
pm2 start ecosystem.config.js

# Guardar configuración de PM2
pm2 save

# Mostrar estado
echo "📊 Estado de la aplicación:"
pm2 status

echo "✅ Despliegue completado!"
echo "📋 Logs disponibles con: pm2 logs nutriunai"
echo "🔄 Reiniciar con: pm2 restart nutriunai"
echo "🛑 Detener con: pm2 stop nutriunai"
