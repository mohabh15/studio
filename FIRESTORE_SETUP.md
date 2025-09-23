# Configuración de Firestore para Budget3M

## Pasos para configurar Firestore

### 1. Crear proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Activa Firestore Database en tu proyecto

### 2. Obtener configuración del proyecto
1. En Firebase Console, ve a Configuración del proyecto (Project Settings)
2. En la pestaña "General", busca la sección "Tu aplicación" (Your apps)
3. Si no tienes una aplicación web, regístrala haciendo clic en el icono de `</>`
4. Copia la configuración de Firebase

### 3. Configurar variables de entorno
1. Copia el archivo `.env.local` y renómbralo si es necesario
2. Reemplaza los valores de ejemplo con los de tu proyecto Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
```

### 4. Configurar Firestore Database
1. Ve a Firestore Database en Firebase Console
2. Crea la base de datos eligiendo el modo de producción o pruebas
3. Configura las reglas de seguridad iniciales:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Estructura de las colecciones
La aplicación usará las siguientes colecciones:

- **transactions**: Para almacenar las transacciones
- **budgets**: Para almacenar los presupuestos
- **categories**: Para almacenar las categorías

### 6. Ejecutar la aplicación
```bash
npm run dev
```

## Notas importantes
- Los datos de ejemplo se cargarán automáticamente si la base de datos está vacía
- La aplicación está configurada para usar Firestore en tiempo real
- Considera implementar autenticación para mayor seguridad en producción