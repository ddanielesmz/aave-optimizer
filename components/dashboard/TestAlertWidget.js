"use client";

import React from "react";
import AlertSettings from "@/components/AlertSettings";
import TestAlertIcon from "@/components/TestAlertIcon";

/**
 * Widget di test per verificare la visibilità degli alert
 */
const TestAlertWidget = () => {
  return (
    <div className="card bg-base-100 rounded-2xl border border-base-300 shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Test Alert Widget</h3>
        <div className="flex items-center gap-2">
          <TestAlertIcon />
          <AlertSettings
            widgetType="healthFactor"
            currentValue={1.5}
            widgetName="Test Widget"
          />
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">1.50</div>
        <div className="text-sm text-gray-600">Health Factor</div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Questo widget serve per testare la visibilità delle icone alert.
        Dovresti vedere due icone 🔔 nell'angolo in alto a destra.
      </div>
    </div>
  );
};

export default TestAlertWidget;
