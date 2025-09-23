# Reglas de Firestore para Budget3M

## Reglas de Desarrollo (Permisos Abiertos)

Para desarrollo y pruebas, usa estas reglas que permiten todas las operaciones sin autenticación:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Reglas de Producción (Recomendadas)

Para producción, usa estas reglas más seguras con autenticación:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{transaction} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /budgets/{budget} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /categories/{category} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Cómo Aplicar las Reglas

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto Budget3M
3. Navega a "Firestore Database" → "Reglas"
4. Copia y pega las reglas de desarrollo arriba
5. Haz clic en "Publicar"

## Notas Importantes

- Las reglas de desarrollo permiten **TODO** sin autenticación
- **NO** uses reglas abiertas en producción
- Para producción, implementa autenticación Firebase Auth
- Las reglas de producción requieren que cada documento tenga un campo `userId`