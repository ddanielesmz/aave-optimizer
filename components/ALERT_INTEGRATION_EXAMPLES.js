/**
 * ESEMPIO: Come integrare AlertSettings nei widget esistenti
 * 
 * Questo file mostra diversi modi per aggiungere il sistema di alert
 * ai widget della dashboard.
 */

import React from 'react';
import AlertSettings from '@/components/AlertSettings';

// ========================================
// METODO 1: Integrazione diretta nel widget
// ========================================

const ExampleWidget1 = ({ currentValue }) => {
  return (
    <div className="card bg-base-100 p-6">
      {/* Header del widget */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Health Factor</h3>
        
        {/* AlertSettings integrato direttamente */}
        <AlertSettings
          widgetType="healthFactor"
          currentValue={currentValue}
          widgetName="Health Factor"
        />
      </div>
      
      {/* Contenuto del widget */}
      <div className="text-2xl font-bold">
        {currentValue?.toFixed(2) || 'N/A'}
      </div>
    </div>
  );
};

// ========================================
// METODO 2: Usando il componente wrapper
// ========================================

import WidgetWithAlerts from '@/components/WidgetWithAlerts';

const ExampleWidget2 = ({ currentValue }) => {
  return (
    <WidgetWithAlerts
      widgetType="ltv"
      currentValue={currentValue}
      widgetName="LTV Ratio"
      className="card bg-base-100 p-6"
    >
      {/* Contenuto del widget originale */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">LTV Ratio</h3>
      </div>
      
      <div className="text-2xl font-bold">
        {(currentValue * 100)?.toFixed(1) || 'N/A'}%
      </div>
    </WidgetWithAlerts>
  );
};

// ========================================
// METODO 3: Posizionamento personalizzato
// ========================================

const ExampleWidget3 = ({ currentValue }) => {
  return (
    <div className="card bg-base-100 p-6 relative">
      {/* AlertSettings posizionato in alto a destra */}
      <div className="absolute top-2 right-2">
        <AlertSettings
          widgetType="netAPY"
          currentValue={currentValue}
          widgetName="Net APY"
        />
      </div>
      
      {/* Header del widget */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Net APY</h3>
      </div>
      
      {/* Contenuto del widget */}
      <div className="text-2xl font-bold">
        {(currentValue * 100)?.toFixed(2) || 'N/A'}%
      </div>
    </div>
  );
};

// ========================================
// METODO 4: Integrazione con altri controlli
// ========================================

import InfoButton from '@/components/InfoButton';

const ExampleWidget4 = ({ currentValue }) => {
  return (
    <div className="card bg-base-100 p-6">
      {/* Header con più controlli */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Health Factor</h3>
          <InfoButton 
            title="Health Factor"
            content="Il Health Factor indica quanto sei lontano dalla liquidazione."
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Altri controlli come refresh, settings, etc. */}
          <button className="btn btn-ghost btn-sm">🔄</button>
          
          {/* AlertSettings */}
          <AlertSettings
            widgetType="healthFactor"
            currentValue={currentValue}
            widgetName="Health Factor"
          />
        </div>
      </div>
      
      {/* Contenuto del widget */}
      <div className="text-2xl font-bold">
        {currentValue?.toFixed(2) || 'N/A'}
      </div>
    </div>
  );
};

// ========================================
// TIPI DI WIDGET SUPPORTATI
// ========================================

/*
Widget Type: "healthFactor"
- Descrizione: Health Factor di Aave
- Valore: Numero (es. 1.5, 2.0, Infinity)
- Condizioni utili: 
  * "less_than" con soglia 1.5 (alert quando scende sotto soglia sicura)
  * "less_than" con soglia 1.1 (alert quando è vicino alla liquidazione)

Widget Type: "ltv"
- Descrizione: Loan-to-Value ratio
- Valore: Numero tra 0 e 1 (es. 0.75 = 75%)
- Condizioni utili:
  * "greater_than" con soglia 0.8 (alert quando supera 80%)
  * "greater_than" con soglia 0.9 (alert quando è molto alto)

Widget Type: "netAPY"
- Descrizione: Net Annual Percentage Yield
- Valore: Numero (es. 0.05 = 5%, -0.02 = -2%)
- Condizioni utili:
  * "less_than" con soglia 0 (alert quando diventa negativo)
  * "greater_than" con soglia 0.1 (alert quando supera 10%)
*/

export {
  ExampleWidget1,
  ExampleWidget2,
  ExampleWidget3,
  ExampleWidget4,
};
