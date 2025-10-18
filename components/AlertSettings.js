"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import apiClient from "@/libs/api";

const AlertSettings = ({ widgetType, currentValue, widgetName }) => {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alertName: "",
    condition: "less_than",
    threshold: 0,
    telegramChatId: "",
    customMessage: "",
    cooldownMinutes: 60,
  });

  // Carica alert esistenti
  useEffect(() => {
    if (session?.user?.id) {
      loadAlerts();
    }
  }, [session]);

  const loadAlerts = async () => {
    try {
      const response = await apiClient.get(`/api/alerts?widgetType=${widgetType}`);
      setAlerts(response.data || []);
    } catch (error) {
      console.error("Errore nel caricamento alert:", error);
    }
  };

  const createAlert = async (e) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      alert("Devi essere autenticato per creare alert. Vai su /api/auth/signin");
      return;
    }
    
    setIsLoading(true);

    try {
      await apiClient.post("/api/alerts", {
        ...newAlert,
        widgetType,
        userId: session.user.id,
      });

      // Reset form
      setNewAlert({
        alertName: "",
        condition: "less_than",
        threshold: 0,
        telegramChatId: "",
        customMessage: "",
        cooldownMinutes: 60,
      });

      await loadAlerts();
    } catch (error) {
      console.error("Errore nella creazione alert:", error);
      alert("Errore nella creazione dell'alert");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAlert = async (alertId, isActive) => {
    try {
      await apiClient.patch(`/api/alerts/${alertId}`, { isActive });
      await loadAlerts();
    } catch (error) {
      console.error("Errore nell'aggiornamento alert:", error);
    }
  };

  const deleteAlert = async (alertId) => {
    if (!confirm("Sei sicuro di voler eliminare questo alert?")) return;

    try {
      await apiClient.delete(`/api/alerts/${alertId}`);
      await loadAlerts();
    } catch (error) {
      console.error("Errore nell'eliminazione alert:", error);
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case "greater_than":
        return "maggiore di";
      case "less_than":
        return "minore di";
      case "equals":
        return "uguale a";
      default:
        return condition;
    }
  };

  const getWidgetDisplayName = () => {
    switch (widgetType) {
      case "healthFactor":
        return "Health Factor";
      case "ltv":
        return "LTV Ratio";
      case "netAPY":
        return "Net APY";
      default:
        return widgetName;
    }
  };

  // Mostra sempre l'icona per permettere il test, anche senza autenticazione
  // if (!session?.user?.id) return null;

  return (
    <div className="relative">
      {/* Pulsante per aprire le impostazioni */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-700"
        title="Impostazioni Alert"
      >
        🔔
      </button>

      {/* Modal delle impostazioni */}
      {isOpen && (
        <div className="absolute top-8 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">
              Alert per {getWidgetDisplayName()}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-xs"
            >
              ✕
            </button>
          </div>

          {/* Valore attuale */}
          <div className="mb-4 p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Valore attuale: </span>
            <span className="font-semibold">{currentValue?.toFixed(4) || "N/A"}</span>
          </div>

          {/* Lista alert esistenti */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Alert Attivi:</h4>
            {!session?.user?.id ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Autenticazione richiesta</strong><br/>
                  Devi essere loggato per configurare alert.<br/>
                  <a href="/api/auth/signin" className="text-blue-600 underline">Vai al login</a>
                </p>
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-gray-500">Nessun alert configurato</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{alert.alertName}</div>
                      <div className="text-gray-600">
                        {getConditionText(alert.condition)} {alert.threshold}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={alert.isActive}
                        onChange={(e) => toggleAlert(alert._id, e.target.checked)}
                        className="checkbox checkbox-xs"
                      />
                      <button
                        onClick={() => deleteAlert(alert._id)}
                        className="btn btn-ghost btn-xs text-red-500"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form per nuovo alert */}
          <form onSubmit={createAlert} className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Nuovo Alert:</h4>
            
            {!session?.user?.id ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  Effettua il login per configurare alert
                </p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Nome alert"
                  value={newAlert.alertName}
                  onChange={(e) => setNewAlert({ ...newAlert, alertName: e.target.value })}
                  className="input input-bordered input-sm w-full"
                  required
                />

            <div className="flex space-x-2">
              <select
                value={newAlert.condition}
                onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                className="select select-bordered select-sm flex-1"
              >
                <option value="less_than">Minore di</option>
                <option value="greater_than">Maggiore di</option>
                <option value="equals">Uguale a</option>
              </select>
              
              <input
                type="number"
                step="0.0001"
                placeholder="Soglia"
                value={newAlert.threshold}
                onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) || 0 })}
                className="input input-bordered input-sm w-20"
                required
              />
            </div>

            <input
              type="text"
              placeholder="Chat ID Telegram"
              value={newAlert.telegramChatId}
              onChange={(e) => setNewAlert({ ...newAlert, telegramChatId: e.target.value })}
              className="input input-bordered input-sm w-full"
              required
            />

            <textarea
              placeholder="Messaggio personalizzato (opzionale)"
              value={newAlert.customMessage}
              onChange={(e) => setNewAlert({ ...newAlert, customMessage: e.target.value })}
              className="textarea textarea-bordered textarea-sm w-full"
              rows={2}
            />

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Cooldown:</label>
              <input
                type="number"
                min="1"
                max="1440"
                value={newAlert.cooldownMinutes}
                onChange={(e) => setNewAlert({ ...newAlert, cooldownMinutes: parseInt(e.target.value) || 60 })}
                className="input input-bordered input-sm w-16"
              />
              <span className="text-sm text-gray-600">min</span>
            </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-sm w-full"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "Crea Alert"
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default AlertSettings;
