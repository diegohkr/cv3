# 🚀 Guía de Deployment - China Verifier

Esta guía explica cómo desplegar China Verifier en diferentes plataformas y entornos de producción.

## 📋 Prerrequisitos

- Node.js 18.0 o superior
- pnpm 8.0 o superior (recomendado)
- Git

## 🏗️ Preparación para Producción

### 1. Clonar y Configurar el Proyecto

```bash
# Clonar el repositorio
git clone [tu-repositorio-url]
cd china-verifier

# Instalar dependencias
pnpm install

# Ejecutar build de producción
pnpm run build
```

### 2. Verificar el Build

```bash
# Preview local del build de producción
pnpm run preview

# Verificar que la aplicación funcione en http://localhost:4173
```

## 🌐 Opciones de Deployment

### 1. Vercel (Recomendado)

**Opción A: Deploy desde GitHub**
1. Conecta tu repositorio a Vercel
2. Configuración automática detectada
3. Deploy automático en cada push

**Opción B: Deploy con CLI**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy desde el directorio del proyecto
vercel

# Deploy a producción
vercel --prod
```

**Configuración en `vercel.json`:**
```json
{
  "framework": "vite",
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Netlify

**Deploy con Drag & Drop:**
1. Ejecutar `pnpm run build`
2. Arrastrar carpeta `dist` a Netlify
3. Configurar redirects para SPA

**Deploy con Git:**
1. Conectar repositorio
2. Configurar build settings:
   - **Build command:** `pnpm run build`
   - **Publish directory:** `dist`
   - **Node version:** 18

**Archivo `netlify.toml`:**
```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 3. GitHub Pages

**Usando GitHub Actions:**

Crear `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build
      run: pnpm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### 4. DigitalOcean App Platform

**Configuración:**
```yaml
name: china-verifier
services:
- name: web
  source_dir: /
  github:
    repo: tu-usuario/china-verifier
    branch: main
  run_command: pnpm run preview
  build_command: pnpm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  http_port: 4173
```

### 5. Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway init
railway up
```

**Configuración automática:**
- Detecta Vite automáticamente
- Variables de entorno configurables
- SSL gratuito incluido

### 6. Servidor VPS (Ubuntu/Debian)

**Instalación en servidor:**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar nginx
sudo apt install nginx -y

# Clonar proyecto
git clone [tu-repositorio-url] /var/www/china-verifier
cd /var/www/china-verifier

# Instalar dependencias y build
pnpm install
pnpm run build

# Configurar nginx
sudo nano /etc/nginx/sites-available/china-verifier
```

**Configuración de Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    root /var/www/china-verifier/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Caché para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        text/js
        text/xml
        text/javascript
        application/javascript
        application/xml+rss;
}
```

**Activar configuración:**
```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/china-verifier /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx

# Habilitar SSL con Let's Encrypt (opcional)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 🔧 Configuraciones Específicas

### Variables de Entorno

Para diferentes entornos, crear archivos de configuración:

**`.env.production`:**
```env
VITE_API_URL=https://api.tu-dominio.com
VITE_APP_TITLE=China Verifier
VITE_ENABLE_ANALYTICS=true
```

**`.env.staging`:**
```env
VITE_API_URL=https://staging-api.tu-dominio.com
VITE_APP_TITLE=China Verifier (Staging)
VITE_ENABLE_ANALYTICS=false
```

### Optimización para Producción

**vite.config.ts optimizado:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
})
```

## 🔍 Verificación Post-Deploy

### Checklist de Verificación

- [ ] Página de login carga correctamente
- [ ] Botón demo funciona
- [ ] Chat interface funciona
- [ ] Búsqueda de empresas operativa
- [ ] Subida de archivos funciona
- [ ] Responsive design en móvil
- [ ] Performance > 90 en Lighthouse
- [ ] SSL habilitado (HTTPS)
- [ ] Redirects SPA funcionan
- [ ] Assets se cargan correctamente

### Comandos de Verificación

```bash
# Verificar build
du -sh dist/

# Analizar bundle
npx vite-bundle-analyzer dist/

# Test de performance
npx lighthouse https://tu-dominio.com --output=html

# Verificar links rotos
npx broken-link-checker https://tu-dominio.com
```

## 🔄 CI/CD Pipeline

### GitHub Actions Completo

`.github/workflows/ci-cd.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - uses: pnpm/action-setup@v2
      with:
        version: 8
    - run: pnpm install
    - run: pnpm run build
    - run: pnpm run test:ci
    
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - uses: pnpm/action-setup@v2
      with:
        version: 8
    - run: pnpm install
    - run: pnpm run build
    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

## 🌍 CDN y Performance

### Configuración de CDN

**Cloudflare (Recomendado):**
1. Agregar dominio a Cloudflare
2. Configurar DNS
3. Habilitar optimizaciones:
   - Minificación automática
   - Brotli compression
   - Cache rules
   - Page rules

**AWS CloudFront:**
```json
{
  "Origins": [{
    "DomainName": "tu-vercel-app.vercel.app",
    "Id": "china-verifier-origin",
    "CustomOriginConfig": {
      "HTTPPort": 443,
      "OriginProtocolPolicy": "https-only"
    }
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "china-verifier-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true
  }
}
```

## 📊 Monitoreo y Analytics

### Google Analytics 4

**Instalación:**
```typescript
// src/lib/analytics.ts
import { gtag } from 'ga-gtag'

export const pageview = (url: string) => {
  gtag('config', 'GA_MEASUREMENT_ID', {
    page_path: url,
  })
}

export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}
```

### Sentry Error Tracking

```bash
pnpm add @sentry/react @sentry/tracing
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
})
```

## 🔐 Seguridad en Producción

### Headers de Seguridad

**Configuración nginx:**
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:; connect-src 'self' api.tu-dominio.com;";
```

### Configuración HTTPS

```bash
# Renovación automática SSL
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🆘 Troubleshooting

### Problemas Comunes

**Error 404 en rutas:**
- Verificar configuración SPA redirects
- Revisar nginx/apache config

**Assets no cargan:**
- Verificar paths relativos
- Revisar configuración base en vite.config.ts

**Build falla:**
- Verificar versión Node.js (>=18)
- Limpiar node_modules y reinstalar

**Performance lenta:**
- Verificar bundle size
- Implementar code splitting
- Optimizar imágenes

### Logs y Debugging

```bash
# Ver logs nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor proceso
pm2 logs china-verifier
pm2 monit
```

## 📞 Soporte

Para problemas de deployment:
1. Revisar esta guía
2. Verificar logs del servidor
3. Consultar documentación de la plataforma
4. Crear issue en GitHub con detalles del error

---

**¡Felicitaciones! 🎉 Tu aplicación China Verifier está ahora en producción.**

*Para actualizaciones futuras, simplemente realiza push a tu rama principal y el deployment será automático.*
