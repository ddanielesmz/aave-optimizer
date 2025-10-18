"use client";

import React from "react";

/**
 * Componente di test per verificare che l'icona alert sia visibile
 * Da usare temporaneamente per debug
 */
const TestAlertIcon = () => {
  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-700"
        title="Test Alert Icon"
        onClick={() => alert("Icona alert funziona!")}
      >
        🔔
      </button>
    </div>
  );
};

export default TestAlertIcon;
