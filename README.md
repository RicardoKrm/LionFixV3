# Guía de Instalación y Despliegue de LionFix Cloud ERP en un VPS (Hostinger)

Esta guía describe los pasos para instalar y desplegar la aplicación en un servidor VPS, como los ofrecidos por Hostinger.

## Requisitos Previos del Servidor

Antes de comenzar, asegúrate de que tu VPS tenga instalado lo siguiente:
1.  **Node.js**: Versión 18.x o superior.
2.  **npm** (viene con Node.js) o **yarn**.
3.  **Git** (para clonar el repositorio).
4.  **PM2**: Un gestor de procesos para Node.js que mantendrá tu aplicación en línea.
5.  **Nginx** (Recomendado): Como proxy inverso para servir la aplicación de forma segura en el puerto 80/443.
6.  **Acceso a una base de datos PostgreSQL**: Puede estar en el mismo VPS o en un servicio de base de datos gestionado.

Puedes instalar Node.js, npm y PM2 con los siguientes comandos (ejemplo para Ubuntu):
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (ejemplo para v20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install pm2 -g
```

---

## Paso 1: Obtener el Código del Proyecto

1.  **Conéctate a tu VPS** a través de SSH.
2.  Navega al directorio donde deseas alojar tu aplicación (ej. `/var/www`).
3.  **Clona o sube el proyecto**. Si tienes el código en un repositorio Git:
    ```bash
    git clone <URL_DEL_REPOSITORIO> lionfix-erp
    cd lionfix-erp
    ```
    Si no, puedes subir los archivos del proyecto a este directorio usando SFTP o el Administrador de Archivos de Hostinger.

---

## Paso 2: Instalar Dependencias

Dentro del directorio del proyecto (`lionfix-erp`), instala todas las dependencias necesarias:
```bash
npm install
```
O si prefieres usar `yarn`:
```bash
yarn install
```

---

## Paso 3: Configurar Variables de Entorno

Este es un paso crítico para conectar la aplicación con tus servicios (base de datos, IA, etc.).

1.  Crea una copia del archivo `.env.example` (si existe) o crea un nuevo archivo llamado `.env` en la raíz del proyecto.
    ```bash
    cp .env.example .env
    ```
    O si no existe:
    ```bash
    touch .env
    ```

2.  Abre el archivo `.env` con un editor de texto (como `nano` o `vim`) y añade las siguientes variables:

    ```ini
    # Variables de Conexión a PostgreSQL
    # Esta es la cadena de conexión que tu cliente de base de datos (node-postgres, Prisma, etc.) usará.
    # Asegúrate de que el host sea accesible desde el VPS (si es externo, usa la IP pública o dominio).
    DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_DB"

    # API Key para Google Genkit (Generative AI)
    # Obtén esta clave desde Google AI Studio (https://aistudio.google.com/).
    GEMINI_API_KEY="TU_API_KEY_DE_GEMINI"

    # Otras variables de entorno que tu aplicación pueda necesitar.
    # NEXT_PUBLIC_...
    ```

    **Importante:** Reemplaza `USUARIO`, `CONTRASEÑA`, `HOST`, `PUERTO` y `NOMBRE_DB` con los datos reales de tu base de datos PostgreSQL.

---

## Paso 3.5: Crear la Estructura de la Base de Datos (Schema)

Antes de ejecutar la aplicación, debes crear las tablas necesarias en tu base de datos PostgreSQL. Conéctate a tu base de datos (usando `psql`, DBeaver, o cualquier otro cliente) y ejecuta los siguientes scripts SQL.

**IMPORTANTE:** Estos scripts crean la estructura. El orden es importante debido a las relaciones (foreign keys).

```sql
-- Tabla para los usuarios del sistema (admin, mecanico, cliente)
CREATE TABLE "users" (
    "uid" VARCHAR(255) PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255),
    "avatarUrl" TEXT,
    "role" VARCHAR(50) NOT NULL,
    "password_hash" TEXT NOT NULL -- En un sistema real, se almacenaría un hash, no la contraseña.
);

-- Tabla para los clientes del taller
CREATE TABLE "clients" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "phone" VARCHAR(50),
    "user_uid" VARCHAR(255) UNIQUE REFERENCES "users"("uid") -- Relación opcional si el cliente es usuario del portal
);

-- Tabla para los vehículos
CREATE TABLE "vehicles" (
    "id" VARCHAR(255) PRIMARY KEY,
    "licensePlate" VARCHAR(20) UNIQUE NOT NULL,
    "make" VARCHAR(100),
    "model" VARCHAR(100),
    "year" INTEGER,
    "vin" VARCHAR(100) UNIQUE,
    "motorNumber" VARCHAR(100),
    "owner_id" VARCHAR(255) REFERENCES "clients"("id") ON DELETE CASCADE -- Un vehículo pertenece a un cliente
);

-- Tabla para los técnicos
CREATE TABLE "technicians" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "avatarUrl" TEXT,
    "specialties" JSONB, -- Usamos JSONB para guardar el array de strings
    "hireDate" TIMESTAMP WITH TIME ZONE,
    "contact" VARCHAR(50),
    "baseSalary" INTEGER,
    "extraHourRate" INTEGER,
    "extraHoursThisMonth" INTEGER,
    "maxExtraHours" INTEGER,
    "user_uid" VARCHAR(255) UNIQUE REFERENCES "users"("uid") -- Relación opcional si el técnico es usuario del portal
);

-- Tabla para el inventario de repuestos
CREATE TABLE "parts" (
    "sku" VARCHAR(100) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "location" VARCHAR(100),
    "alertThreshold" INTEGER NOT NULL DEFAULT 0,
    "cost" INTEGER NOT NULL,
    "price" INTEGER NOT NULL
);

-- Tabla principal de Órdenes de Trabajo (OT)
CREATE TABLE "work_orders" (
    "id" VARCHAR(255) PRIMARY KEY,
    "service" TEXT NOT NULL,
    "type" VARCHAR(100),
    "status" VARCHAR(100),
    "entryDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "completionDate" TIMESTAMP WITH TIME ZONE,
    "laborHours" NUMERIC(5, 2),
    "satisfactionRating" INTEGER,
    "satisfactionComment" TEXT,
    "finalReport" TEXT,
    "client_id" VARCHAR(255) REFERENCES "clients"("id"),
    "vehicle_id" VARCHAR(255) REFERENCES "vehicles"("id"),
    "technician_id" VARCHAR(255) REFERENCES "technicians"("id")
);

-- Tabla de unión para los repuestos usados en una OT (relación muchos a muchos)
CREATE TABLE "work_order_parts" (
    "work_order_id" VARCHAR(255) REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "part_sku" VARCHAR(100) REFERENCES "parts"("sku"),
    "quantity" INTEGER NOT NULL,
    "cost_at_time" INTEGER NOT NULL, -- Costo del repuesto al momento de la venta
    "price_at_time" INTEGER NOT NULL, -- Precio de venta al momento de la venta
    PRIMARY KEY ("work_order_id", "part_sku")
);

-- Tabla para la bitácora de servicio
CREATE TABLE "service_log_entries" (
    "id" SERIAL PRIMARY KEY,
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
    "entry" TEXT NOT NULL,
    "work_order_id" VARCHAR(255) REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "technician_id" VARCHAR(255) REFERENCES "technicians"("id")
);

-- Tabla para las cotizaciones
CREATE TABLE "quotes" (
    "id" VARCHAR(255) PRIMARY KEY,
    "date" TIMESTAMP WITH TIME ZONE,
    "total" INTEGER,
    "status" VARCHAR(50),
    "items" JSONB, -- Es más simple almacenar los items como JSONB para este caso
    "client_id" VARCHAR(255) REFERENCES "clients"("id"),
    "vehicle_id" VARCHAR(255) REFERENCES "vehicles"("id")
);

-- Puedes añadir más tablas para Contratos, Checklists, etc., siguiendo el mismo patrón.
-- Los índices pueden ser útiles para mejorar el rendimiento de las búsquedas.
CREATE INDEX idx_vehicles_owner ON "vehicles"("owner_id");
CREATE INDEX idx_work_orders_client ON "work_orders"("client_id");
CREATE INDEX idx_work_orders_vehicle ON "work_orders"("vehicle_id");

```
**Nota sobre Migraciones:** Para un proyecto en evolución, se recomienda usar una herramienta de migración como `node-pg-migrate` o las capacidades de migración de un ORM como Prisma. Esto permite versionar los cambios en el schema de la base de datos y aplicarlos de forma segura. Los scripts de arriba son para la **inicialización** de la base de datos.

---

## Paso 4: Construir la Aplicación para Producción

Next.js necesita ser "construido" para optimizar el código para producción.
```bash
npm run build
```
Este comando creará un directorio `.next` con todo el código optimizado, listo para ser servido.

---

## Paso 5: Ejecutar la Aplicación con PM2

Para que tu aplicación se ejecute de forma continua (incluso si se cierra o el servidor se reinicia), usamos PM2.

1.  **Iniciar la aplicación**:
    ```bash
    pm2 start npm --name "lionfix-erp" -- start
    ```
    - `pm2 start npm`: Le dice a PM2 que use un script de npm.
    - `--name "lionfix-erp"`: Le da un nombre fácil de recordar al proceso.
    - `-- start`: Ejecuta el script `start` definido en `package.json`, que es `next start`.

2.  **Verificar que la aplicación está corriendo**:
    ```bash
    pm2 list
    ```
    Deberías ver "lionfix-erp" en la lista con el estado "online".

3.  **Guardar la configuración de PM2** para que se reinicie automáticamente si el VPS se reinicia:
    ```bash
    pm2 save
    pm2 startup
    ```
    (Sigue las instrucciones que te dé el último comando para completar la configuración del startup-script).

La aplicación ahora estará corriendo en el puerto por defecto de Next.js (generalmente el 3000).

---

## Paso 6 (Recomendado): Configurar Nginx como Proxy Inverso

Para que los usuarios puedan acceder a tu aplicación a través de tu dominio (ej. `http://tu-dominio.com`) en lugar de `http://tu-dominio.com:3000`, y para añadir seguridad con SSL (HTTPS), debes usar Nginx.

1.  **Instalar Nginx**: `sudo apt install nginx -y`
2.  **Crear un archivo de configuración** para tu sitio en `/etc/nginx/sites-available/lionfix-erp`:
    ```bash
    sudo nano /etc/nginx/sites-available/lionfix-erp
    ```
3.  **Pega la siguiente configuración**, reemplazando `tu-dominio.com` con tu dominio real:

    ```nginx
    server {
        listen 80;
        server_name tu-dominio.com www.tu-dominio.com;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

4.  **Habilita el sitio y reinicia Nginx**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/lionfix-erp /etc/nginx/sites-enabled/
    sudo nginx -t  # Para probar la configuración
    sudo systemctl restart nginx
    ```

5.  **Añadir SSL (HTTPS)**: Usa Certbot para obtener un certificado SSL gratuito de Let's Encrypt.
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
    ```
    Sigue las instrucciones en pantalla.

¡Y listo! Tu aplicación LionFix ERP estará desplegada, corriendo de forma robusta y segura en tu VPS.
