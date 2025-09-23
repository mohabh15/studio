import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { onSnapshot, collection, query, limit, DocumentData, QuerySnapshot } from 'firebase/firestore';

export function FirestoreSyncStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Verificar conexión con Firestore
    const unsubscribe = onSnapshot(
      query(collection(db, 'transactions'), limit(1)),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setIsConnected(true);
        setIsSyncing(false);
        // Animación de éxito
        console.log('Conexión exitosa con Firestore');
      },
      (error: Error) => {
        console.error('Error de conexión con Firestore:', error);
        setIsConnected(false);
        setIsSyncing(false);
        // Animación de error
        console.log('Error en conexión con Firestore');
      }
    );

    // Simular sincronización cada 30 segundos
    const syncInterval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
    };
  }, []);

  const getStatusColor = () => {
    if (!isConnected) return '#EF4444'; // Rojo para desconectado
    if (isSyncing) return '#F59E0B'; // Amarillo para sincronizando
    return '#10B981'; // Verde para conectado
  };

  const getStatusText = () => {
    if (!isConnected) return 'Sin conexión';
    if (isSyncing) return 'Sincronizando...';
    return 'Conectado';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      padding: '6px 12px',
      backgroundColor: '#F3F4F6',
      borderRadius: '12px',
      margin: '8px 16px'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(),
        marginRight: '8px'
      }} />
      <span style={{
        fontSize: '12px',
        color: '#6B7280',
        fontWeight: '500'
      }}>{getStatusText()}</span>
    </div>
  );
}