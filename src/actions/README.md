# Lógica de Backend y Conexión a Base de Datos

Este directorio (`/src/actions`) es el corazón de la comunicación entre el frontend (los componentes de React) y el backend (la base de datos y la lógica de negocio). Utilizamos el patrón de **Next.js Server Actions**.

## ¿Cómo Funciona?

1.  **Crear un Archivo de Acciones**: Por cada "módulo" o "entidad" de la aplicación (ej. `workOrders`, `clients`, `inventory`), se debe crear un archivo como `workOrderActions.ts`.

2.  **Escribir Funciones de Servidor**: Dentro de ese archivo, cada función que necesite interactuar con la base de datos debe ser una función `async` y comenzar con la directiva `"use server";`.

3.  **Implementar la Lógica**: Dentro de estas funciones es donde se deben realizar las llamadas a la base de datos (ej. Firebase Firestore, Prisma, etc.). Se debe reemplazar toda la lógica que actualmente consume datos del archivo `src/lib/data.ts`.

4.  **Exportar Tipos de Datos**: Mantén la exportación de los tipos de datos (como `VehicleData`) para que el frontend sepa qué esperar.

5.  **Llamar desde el Frontend**: Los componentes de cliente (`"use client"`) pueden importar estas funciones y llamarlas directamente, como si fueran funciones locales. Next.js se encarga automáticamente de la comunicación segura.

## Ejemplo: Reemplazando la Simulación

El archivo `vehicleActions.ts` es el ejemplo perfecto.

**Antes (Simulación):**

```typescript
// src/actions/vehicleActions.ts

'use server';
import { vehicles } from '@/lib/data'; // Importando desde datos simulados

// ...

export async function lookupPlate(plate: string): Promise<VehicleData | null> {
    // Lógica que busca en un array simulado
    const data = getMockVehicleData(plate);
    return data;
}
```

**Después (Conexión Real a Backend):**

```typescript
// src/actions/vehicleActions.ts

'use server';
import { db } from '@/lib/firebase'; // <--- EJEMPLO: Importando la instancia de la base de datos
import { collection, getDocs, query, where } from "firebase/firestore"; 

// ...

export async function lookupPlate(plate: string): Promise<VehicleData | null> {
    // EJEMPLO: Lógica que consulta una base de datos real (Firestore en este caso)
    try {
        const q = query(collection(db, "vehicles"), where("licensePlate", "==", plate.toUpperCase()));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const docData = querySnapshot.docs[0].data();
        return docData as VehicleData;
    } catch (error) {
        console.error("Error looking up plate: ", error);
        return null;
    }
}
```

Este patrón debe replicarse para todas las funcionalidades listadas en el documento de arquitectura del proyecto.
