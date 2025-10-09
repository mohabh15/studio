# BudgetWise

Una aplicación completa de gestión financiera personal construida con Next.js, Firebase y IA. Permite a los usuarios gestionar presupuestos, deudas, transacciones, ahorros e inversiones de manera intuitiva y eficiente.

## 🚀 Características Principales

### Gestión de Transacciones
- Registro manual de ingresos y gastos
- Categorización automática y manual
- Transacciones recurrentes
- Escaneo de recibos con OCR usando IA (Google AI)
- Soporte para fotos, geolocalización y notas

### Presupuestos y Planificación
- Creación de presupuestos por categorías
- Seguimiento del cumplimiento de presupuestos
- Presupuestos recurrentes automáticos
- Metas de ahorro a largo plazo

### Gestión de Deudas
- Seguimiento de deudas activas e inactivas
- Proyecciones de pago con diferentes estrategias
- Simulador de pagos
- Visualización de progreso de reducción de deuda

### Dashboard Interactivo
- Resumen financiero con tarjetas de KPIs
- Gráficos de tendencias mensuales (líneas)
- Distribución de gastos por categoría (pie chart)
- Estado de presupuestos (barras de progreso)
- Transacciones recientes
- Flujo de efectivo (area chart)

### Ahorros e Inversiones
- Seguimiento de metas de ahorro
- KPIs de tasa de ahorro
- Gestión de inversiones

### Características Adicionales
- Autenticación segura con Firebase Auth
- Modo oscuro y temas personalizables
- Soporte multiidioma (Español/Inglés)
- Diseño responsivo para móvil y escritorio
- Sincronización en tiempo real
- Exportación de datos en CSV

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI/UX**: Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Firebase (Firestore, Auth, Storage)
- **IA**: Google AI (Genkit) para escaneo de recibos y categorización
- **Gráficos**: Recharts
- **Formularios**: React Hook Form con Zod
- **Internacionalización**: Context API personalizado
- **Estado**: Context API y hooks personalizados

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Proyecto de Firebase configurado

## 🚀 Instalación y Configuración

1. **Clona el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd budgetwise
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura Firebase:**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Firestore, Authentication y Storage
   - Obtén las credenciales del proyecto

4. **Configura las variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Google AI (para escaneo de recibos)
   GOOGLE_GENAI_API_KEY=your_google_ai_api_key

   # Opcional: Configuración adicional
   NEXT_PUBLIC_APP_ENV=development
   ```

5. **Inicializa Firestore (opcional):**
   ```bash
   npm run init-firestore
   ```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:9002`

### Desarrollo con Genkit (IA)
```bash
npm run genkit:dev
```

### Producción
```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Páginas Next.js (App Router)
│   ├── auth-demo/         # Demo de autenticación
│   ├── budgets/           # Gestión de presupuestos
│   ├── debts/             # Gestión de deudas
│   ├── login/             # Página de login
│   ├── savings/           # Ahorros e inversiones
│   ├── settings/          # Configuración
│   └── transactions/      # Transacciones
├── components/            # Componentes reutilizables
│   ├── auth/             # Componentes de autenticación
│   ├── budgets/          # Componentes de presupuestos
│   ├── dashboard/        # Componentes del dashboard
│   ├── debts/            # Componentes de deudas
│   ├── layout/           # Layout y navegación
│   ├── theme/            # Tema y modo oscuro
│   ├── transactions/     # Componentes de transacciones
│   └── ui/               # Componentes base (Radix UI)
├── contexts/             # Contextos de React
├── hooks/                # Hooks personalizados
├── lib/                  # Utilidades y configuración
│   ├── services/         # Servicios (Auth, Firestore)
│   └── utils/            # Utilidades
├── locales/              # Archivos de traducción
└── types/                # Definiciones TypeScript
```

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta ESLint
- `npm run typecheck` - Verifica tipos TypeScript
- `npm run genkit:dev` - Inicia Genkit para desarrollo de IA
- `npm run genkit:watch` - Genkit con watch mode

## 🌐 Internacionalización

La aplicación soporta Español e Inglés. Los archivos de traducción están en `src/locales/`.

## 🎨 Personalización

- **Tema**: Modo oscuro/claro automático
- **Colores**: Personalización de colores de acento
- **Idioma**: Cambio dinámico entre idiomas

## 📊 Roadmap

Consulta `Roadmap.txt` para ver las características planificadas, incluyendo:
- Notificaciones y recordatorios
- Gestión de cuentas múltiples
- Categorización automática con IA
- Importación/exportación de datos
- Modo offline-first
- Integraciones con bancos
- Gamificación

## 🔒 Propiedad y Privacidad

**Este proyecto es totalmente privado y propiedad exclusiva del propietario original.**

- **No se permite la copia, distribución, modificación o uso comercial** sin autorización expresa y por escrito del propietario.
- Cualquier intento de copia, clonación o reutilización del código requerirá **pago al propietario** por el uso de la propiedad intelectual.
- El acceso al repositorio está restringido únicamente a colaboradores autorizados.
- No se aceptan contribuciones externas ni forks públicos.

Para cualquier uso o modificación, contacta directamente al propietario para obtener permisos y acuerdos comerciales.

## 📝 Licencia

Este proyecto no está bajo ninguna licencia open source. Todos los derechos reservados al propietario original.

## 📞 Soporte

Para soporte o preguntas, abre un issue en el repositorio o contacta al equipo de desarrollo.

---

¡Budget3M - Toma el control de tus finanzas personales! 💰📊
