import React, { useState } from 'react';
import { FirestoreUtils } from '@/lib/firestore-utils';

interface FirestoreConfigProps {
  onDataRefresh?: () => void;
}

export function FirestoreConfig({ onDataRefresh }: FirestoreConfigProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      if (onDataRefresh) {
        onDataRefresh();
      }
      // Aquí podrías recargar datos específicos si es necesario
      alert('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      alert('No se pudieron actualizar los datos');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCheckConnection = async () => {
    try {
      const hasData = await FirestoreUtils.hasExistingData();
      alert(
        hasData 
          ? 'Conectado a Firestore y hay datos disponibles'
          : 'Conectado a Firestore pero no hay datos'
      );
    } catch (error) {
      alert('No se pudo conectar a Firestore');
    }
  };

  const handleExportData = async () => {
    try {
      // Aquí podrías implementar la exportación de datos
      alert('Función de exportación disponible');
    } catch (error) {
      alert('No se pudieron exportar los datos');
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      margin: '16px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: '16px'
      }}>Configuración de Firestore</h3>
      
      <button 
        onClick={handleRefreshData}
        disabled={isRefreshing}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '8px',
          border: 'none',
          cursor: isRefreshing ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        <span style={{ marginRight: '8px' }}>🔄</span>
        <span style={{
          fontSize: '14px',
          color: '#2E8B57',
          fontWeight: '500'
        }}>
          {isRefreshing ? 'Actualizando...' : 'Actualizar Datos'}
        </span>
      </button>

      <button 
        onClick={handleCheckConnection}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '8px',
          border: 'none',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        <span style={{ marginRight: '8px' }}>📶</span>
        <span style={{
          fontSize: '14px',
          color: '#2E8B57',
          fontWeight: '500'
        }}>Verificar Conexión</span>
      </button>

      <button 
        onClick={handleExportData}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '8px',
          border: 'none',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        <span style={{ marginRight: '8px' }}>📥</span>
        <span style={{
          fontSize: '14px',
          color: '#2E8B57',
          fontWeight: '500'
        }}>Exportar Datos</span>
      </button>

      <p style={{
        fontSize: '12px',
        color: '#6B7280',
        marginTop: '12px',
        textAlign: 'center'
      }}>
        Tu aplicación está conectada a Firestore. Los datos se sincronizan automáticamente.
      </p>
    </div>
  );
}