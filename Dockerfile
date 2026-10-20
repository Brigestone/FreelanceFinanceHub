FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código fuente del proyecto
COPY backend ./backend
COPY frontend ./frontend
COPY database ./database

# Variable de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto de la aplicación
EXPOSE 3000

# Comando de inicio del servidor
CMD ["node", "backend/src/server.js"]
