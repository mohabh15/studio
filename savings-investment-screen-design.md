# 🎯 Diseño de Pantalla de Ahorro e Inversión

## 📋 Descripción General
Pantalla integrada que combina funcionalidades de ahorro (metas y objetivos) con seguimiento de inversiones, diseñada para proporcionar una visión completa de la salud financiera del usuario.

## 🏗️ Arquitectura de Datos

### Nuevos Tipos de Datos

```typescript
// Tipos para Ahorro
export type SavingsGoal = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;        // Cantidad objetivo
  currentAmount: number;       // Cantidad actual ahorrada
  targetDate: string;          // Fecha objetivo (ISO string)
  category: 'emergency' | 'purchase' | 'travel' | 'retirement' | 'other';
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contributions: SavingsContribution[];
};

export type SavingsContribution = {
  id: string;
  goalId: string;
  amount: number;
  date: string;               // Fecha de la contribución
  description?: string;
  isAutomatic: boolean;       // Si fue transferencia automática
};

// Tipos para Inversiones
export type Investment = {
  id: string;
  userId: string;
  name: string;
  type: 'stocks' | 'bonds' | 'mutual_funds' | 'etf' | 'crypto' | 'real_estate' | 'other';
  symbol?: string;            // Símbolo bursátil
  initialAmount: number;      // Cantidad inicial invertida
  currentValue: number;       // Valor actual
  purchaseDate: string;       // Fecha de compra
  platform?: string;          // Plataforma (Binance, Interactive Brokers, etc.)
  fees?: number;              // Comisión anual en %
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  transactions: InvestmentTransaction[];
};

export type InvestmentTransaction = {
  id: string;
  investmentId: string;
  type: 'buy' | 'sell' | 'dividend' | 'fee' | 'split';
  amount: number;             // Cantidad de acciones/unidades
  price: number;              // Precio por unidad
  totalValue: number;         // amount * price
  date: string;
  fees?: number;              // Comisión de la transacción
  notes?: string;
};
```

## 🎨 Arquitectura de Componentes

### Estructura de la Pantalla Principal (`/savings`)

```
src/app/savings/
├── page.tsx                    # Página principal
├── loading.tsx                 # Loading skeleton
└── layout.tsx                  # Layout específico

src/components/savings/
├── savings-dashboard.tsx       # Dashboard principal
├── savings-goals/
│   ├── savings-goals-list.tsx  # Lista de metas
│   ├── savings-goal-card.tsx   # Card individual de meta
│   ├── savings-goal-dialog.tsx # Crear/editar meta
│   └── savings-progress.tsx    # Barra de progreso
├── investments/
│   ├── investments-list.tsx    # Lista de inversiones
│   ├── investment-card.tsx     # Card individual de inversión
│   ├── investment-dialog.tsx   # Crear/editar inversión
│   ├── investment-chart.tsx    # Gráfico de rendimiento
│   └── performance-summary.tsx # Resumen de rentabilidad
└── shared/
    ├── savings-summary-cards.tsx # Cards resumen
    ├── allocation-chart.tsx      # Distribución de activos
    └── recommendations.tsx       # Consejos personalizados
```

### Componentes Principales

#### 1. SavingsDashboard (Componente Principal)
```typescript
// Layout principal con pestañas
<Card className="glass-card">
  <Tabs defaultValue="overview" className="w-full">
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="overview">Visión General</TabsTrigger>
      <TabsTrigger value="goals">Metas de Ahorro</TabsTrigger>
      <TabsTrigger value="investments">Inversiones</TabsTrigger>
    </TabsList>

    <TabsContent value="overview">
      <SavingsOverview />
    </TabsContent>

    <TabsContent value="goals">
      <SavingsGoalsSection />
    </TabsContent>

    <TabsContent value="investments">
      <InvestmentsSection />
    </TabsContent>
  </Tabs>
</Card>
```

#### 2. SavingsOverview (Visión General)
- **Summary Cards**: Total ahorrado, valor inversiones, progreso mensual
- **Allocation Chart**: Distribución entre ahorro e inversión
- **Recent Activity**: Últimas contribuciones y transacciones
- **Quick Actions**: Botones para añadir meta o inversión rápida

#### 3. SavingsGoalsSection (Gestión de Metas)
- **Lista de Metas**: Cards con progreso visual
- **Crear Nueva Meta**: Dialog con formulario completo
- **Editar/Eliminar**: Acciones en cada meta
- **Filtro por Estado**: Activas, completadas, pausadas

#### 4. InvestmentsSection (Gestión de Inversiones)
- **Portfolio Overview**: Valor total, ganancia/pérdida
- **Lista de Inversiones**: Cards con rendimiento individual
- **Gráfico de Rendimiento**: Evolución histórica
- **Análisis de Riesgo**: Diversificación y exposición

## 📱 Diseño UX/UI

### Layout Responsivo

#### Desktop (>768px)
```
┌─────────────────────────────────────────────────────────────┐
│                    SUMMARY CARDS                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Total      │ │ Inversiones │ │ Progreso    │           │
│  │ Ahorrado   │ │ Actuales    │ │ Mensual     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│  ALLOCATION     │         RECENT ACTIVITY                   │
│  CHART          │  ┌─────────────────────────────────────┐  │
│                 │  │ Últimas contribuciones              │  │
│  (Donut Chart)  │  │ Últimas inversiones                 │  │
│                 │  │ Próximas metas                      │  │
│                 │  └─────────────────────────────────────┘  │
└─────────────────┴───────────────────────────────────────────┘
```

#### Mobile (<768px)
```
┌─────────────────────────────────────┐
│           SUMMARY CARDS             │
│  [Total] [Inversiones] [Progreso]   │
├─────────────────────────────────────┤
│         ALLOCATION CHART            │
│         (Compact Donut)             │
├─────────────────────────────────────┤
│       RECENT ACTIVITY               │
│  [Lista vertical compacta]          │
└─────────────────────────────────────┘
```

### Estados Visuales

#### Metas de Ahorro
- **Progreso < 25%**: Rojo con animación de pulso
- **Progreso 25-75%**: Amarillo con indicador de mitad
- **Progreso > 75%**: Verde con efecto de brillo
- **Completada**: Verde con checkmark y confeti

#### Inversiones
- **Ganancia > 5%**: Verde con flecha hacia arriba
- **Pérdida > 5%**: Rojo con flecha hacia abajo
- **Estable**: Azul neutro
- **Alto Riesgo**: Naranja con indicador de volatilidad

## 📊 Gráficos y Visualizaciones

### 1. Allocation Chart (Distribución de Activos)
- **Tipo**: Donut Chart
- **Datos**: Porcentaje ahorro vs inversión
- **Colores**: Azul (ahorro), Verde (inversiones)
- **Interacción**: Hover para detalles

### 2. Savings Progress Chart (Progreso de Metas)
- **Tipo**: Progress Bars horizontales
- **Datos**: Meta actual vs objetivo
- **Características**: Animación de carga, indicador de tiempo restante

### 3. Investment Performance Chart (Rendimiento de Inversiones)
- **Tipo**: Line Chart (últimos 12 meses)
- **Datos**: Valor histórico de la inversión
- **Características**: Área sombreada, puntos destacados

### 4. Monthly Contributions Chart (Contribuciones Mensuales)
- **Tipo**: Bar Chart
- **Datos**: Contribuciones por mes
- **Características**: Comparación con objetivo mensual

## 🔧 Especificaciones Técnicas

### Integración con Datos Existentes

#### Conexión con Transacciones
```typescript
// Extender tipos existentes
export type Transaction = {
  // ... campos existentes
  savingsGoalId?: string;     // Referencia a meta de ahorro
  investmentId?: string;      // Referencia a inversión
  isAutomatic?: boolean;      // Si fue automática
};
```

#### Cálculos Automáticos
- **Progreso de Metas**: Calcular basado en contribuciones asociadas
- **Valor de Inversiones**: Actualizar con APIs externas o manualmente
- **Rendimiento**: Calcular ganancia/pérdida porcentual

### Internacionalización (i18n)

```json
// src/locales/es.json
{
  "savings": {
    "title": "Ahorro e Inversiones",
    "overview": {
      "totalSaved": "Total Ahorrado",
      "investmentsValue": "Valor Inversiones",
      "monthlyProgress": "Progreso Mensual"
    },
    "goals": {
      "title": "Metas de Ahorro",
      "newGoal": "Nueva Meta",
      "targetAmount": "Cantidad Objetivo",
      "currentAmount": "Cantidad Actual",
      "targetDate": "Fecha Objetivo",
      "category": "Categoría",
      "priority": "Prioridad"
    },
    "investments": {
      "title": "Inversiones",
      "newInvestment": "Nueva Inversión",
      "currentValue": "Valor Actual",
      "totalReturn": "Rentabilidad Total",
      "performance": "Rendimiento"
    }
  }
}
```

### Estado Global y Context

```typescript
// src/contexts/savings-context.tsx
export type SavingsContextType = {
  savingsGoals: SavingsGoal[];
  investments: Investment[];
  totalSaved: number;
  totalInvested: number;
  totalCurrentValue: number;
  monthlyContributions: number;
  refreshData: () => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt'>) => Promise<void>;
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>;
};
```

## 🚀 Funcionalidades Avanzadas

### 1. Contribuciones Automáticas
- Configuración de transferencias automáticas
- Recordatorios de contribución
- Objetivos de ahorro mensual

### 2. Análisis de Rendimiento
- Comparación con benchmarks
- Análisis de riesgo
- Recomendaciones de diversificación

### 3. Notificaciones Inteligentes
- Alerta cuando se acerca fecha objetivo
- Notificación de oportunidades de inversión
- Recordatorios de revisión de portfolio

## 📈 Métricas y KPIs

### Métricas de Ahorro
- Tasa de cumplimiento de metas
- Promedio de ahorro mensual
- Tiempo promedio para completar metas

### Métricas de Inversión
- Rentabilidad total del portfolio
- Sharpe ratio (riesgo ajustado)
- Diversificación por tipo de activo

## 🎯 Plan de Implementación

### Fase 1: Base (1 semana)
- [ ] Estructura de datos básica
- [ ] Pantalla principal con pestañas
- [ ] Gestión básica de metas de ahorro
- [ ] Navegación integrada

### Fase 2: Funcionalidades (1-2 semanas)
- [ ] Sistema completo de inversiones
- [ ] Gráficos y visualizaciones
- [ ] Internacionalización
- [ ] Estado global

### Fase 3: Avanzado (1 semana)
- [ ] Notificaciones inteligentes
- [ ] Análisis de rendimiento
- [ ] Contribuciones automáticas
- [ ] Optimizaciones de UX

## 💡 Consideraciones de Diseño

### Principios UX
1. **Claridad**: Información fácil de entender
2. **Motivación**: Elementos que incentiven el ahorro
3. **Simplicidad**: Flujos intuitivos y directos
4. **Transparencia**: Información clara sobre riesgos

### Accesibilidad
- Navegación por teclado completa
- Contraste adecuado en gráficos
- Textos alternativos en visualizaciones
- Soporte para lectores de pantalla

### Performance
- Lazy loading de gráficos complejos
- Virtualización para listas largas
- Caché inteligente de datos
- Optimización para móviles

---

*Este diseño proporciona una base sólida y escalable para implementar una pantalla completa de ahorro e inversión integrada en la aplicación financiera existente.*