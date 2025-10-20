"use client";

import React from "react";
import AlertSettings from "@/components/AlertSettings";

/**
 * Componente wrapper per aggiungere funzionalità di alert ai widget
 * Mostra come integrare AlertSettings nei widget esistenti
 */
const WidgetWithAlerts = ({ 
  children, 
  widgetType, 
  currentValue, 
  widgetName,
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Widget originale */}
      {children}
      
      {/* Pulsante alert posizionato in alto a destra */}
      <div className="absolute top-2 right-2 z-10">
        <AlertSettings
          widgetType={widgetType}
          currentValue={currentValue}
          widgetName={widgetName}
        />
      </div>
    </div>
  );
};

export default WidgetWithAlerts;
