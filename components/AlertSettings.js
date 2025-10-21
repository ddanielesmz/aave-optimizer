"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import apiClient from "@/libs/api";

const AlertSettings = ({ widgetType, currentValue, widgetName }) => {
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alertName: "",
    condition: "less_than",
    threshold: "",
    telegramUsername: "",
    customMessage: "",
    cooldownMinutes: 60,
  });

  // Ensure portal only renders on client to avoid SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load existing alerts
  useEffect(() => {
    if (isClient) {
      loadAlerts();
    }
  }, [isClient]);

  // Load alerts when modal opens
  useEffect(() => {
    if (isOpen && isClient) {
      loadAlerts();
    }
  }, [isOpen, isClient]);

  const loadAlerts = async () => {
    try {
      const response = await apiClient.get(`/alerts?widgetType=${widgetType}`);
      console.log("Alert response:", response); // Debug log
      setAlerts(response || []);
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };

  const createAlert = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.post("/alerts", {
        ...newAlert,
        threshold: parseFloat(newAlert.threshold) || 0,
        widgetType,
      });

      // Reset form
      setNewAlert({
        alertName: "",
        condition: "less_than",
        threshold: "",
        telegramUsername: "",
        customMessage: "",
        cooldownMinutes: 60,
      });

      await loadAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      alert("Error creating alert");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAlert = async (alertId, isActive) => {
    try {
      await apiClient.patch(`/alerts/${alertId}`, { isActive });
      await loadAlerts();
    } catch (error) {
      console.error("Error updating alert:", error);
    }
  };

  const deleteAlert = async (alertId) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;

    try {
      await apiClient.delete(`/alerts/${alertId}`);
      await loadAlerts();
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case "greater_than":
        return "greater than";
      case "less_than":
        return "less than";
      case "equals":
        return "equals";
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

  const getConditionSymbol = (condition) => {
    switch (condition) {
      case "greater_than":
        return ">";
      case "less_than":
        return "<";
      case "equals":
        return "=";
      default:
        return condition;
    }
  };

  // Get color based on widget type and current value
  const getCurrentValueColor = () => {
    if (!currentValue || currentValue === null) return 'text-base-content/60';
    
    switch (widgetType) {
      case 'healthFactor':
        if (currentValue === Infinity) return 'text-success';
        if (currentValue >= 2.0) return 'text-success'; // Safe
        if (currentValue >= 1.5) return 'text-yellow-500'; // Caution
        if (currentValue >= 1.1) return 'text-orange-500'; // Risk
        return 'text-error'; // Liquidation
      
      case 'ltv':
        // For LTV, we need to determine color based on percentage ranges
        if (currentValue <= 50) return 'text-success'; // Safe
        if (currentValue < 70) return 'text-warning'; // Caution
        if (currentValue < 85) return 'text-warning'; // Risk
        return 'text-error'; // Liquidation
      
      default:
        return 'text-primary'; // Default color for other widget types
    }
  };

  if (!isClient) return null;

  return (
    <>
      {/* Alert Button - Clean bell icon */}
      <button
        className="btn btn-circle btn-ghost btn-xs text-base-content/60 hover:text-primary hover:bg-primary/10 transition-all duration-200"
        onClick={() => setIsOpen(true)}
        title={`Configure alerts for ${getWidgetDisplayName()}`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          className="w-4 h-4 stroke-current"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z"
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M13.73 21a2 2 0 01-3.46 0"
          />
        </svg>
      </button>

      {/* Alert Settings Modal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Card - Clean and minimal */}
          <div className="relative bg-base-100 rounded-xl border border-base-300 shadow-2xl p-5 w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base-content font-semibold text-sm">Alert Settings</h3>
                  <p className="text-xs text-base-content/60">{getWidgetDisplayName()}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm btn-circle hover:bg-base-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Current Value Display - Compact with dynamic color */}
            <div className="mb-4 p-3 bg-base-200/50 rounded-lg border border-base-300/50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/70 font-medium">Current Value</span>
                <span className={`font-semibold text-sm ${getCurrentValueColor()}`}>
                  {currentValue?.toFixed(4) || "N/A"}
                </span>
              </div>
            </div>

            {/* Existing Alerts - Compact */}
            {alerts.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-base-content/70 mb-2 uppercase tracking-wide">Active Alerts</h4>
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <div
                      key={alert._id || alert.id || `alert-${index}`}
                      className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg border border-base-300/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-base-content truncate">{alert.alertName}</div>
                        <div className="text-xs text-base-content/60 mt-0.5">
                          {getConditionSymbol(alert.condition)} {alert.threshold} • @{alert.telegramUsername.replace('@', '')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <input
                          type="checkbox"
                          checked={alert.isActive}
                          onChange={(e) => toggleAlert(alert._id || alert.id, e.target.checked)}
                          className="toggle toggle-xs toggle-primary"
                        />
                        <button
                          onClick={() => deleteAlert(alert._id || alert.id)}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 p-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Alert Form - Compact */}
            <form onSubmit={createAlert} className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                <h4 className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Create Alert</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="form-control">
                  <input
                    type="text"
                    placeholder="Alert name"
                    value={newAlert.alertName}
                    onChange={(e) => setNewAlert({ ...newAlert, alertName: e.target.value })}
                    className="input input-bordered input-xs w-full focus:input-primary"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                    className="select select-bordered select-xs focus:select-primary"
                  >
                    <option value="less_than">Less than</option>
                    <option value="greater_than">Greater than</option>
                    <option value="equals">Equals</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="form-control">
                  <input
                    type="text"
                    placeholder="Threshold"
                    value={newAlert.threshold}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setNewAlert({ ...newAlert, threshold: value });
                      }
                    }}
                    className="input input-bordered input-xs focus:input-primary"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <input
                    type="text"
                    placeholder="@username"
                    value={newAlert.telegramUsername}
                    onChange={(e) => setNewAlert({ ...newAlert, telegramUsername: e.target.value })}
                    className="input input-bordered input-xs focus:input-primary"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <textarea
                  placeholder="Custom message (optional)"
                  value={newAlert.customMessage}
                  onChange={(e) => setNewAlert({ ...newAlert, customMessage: e.target.value })}
                  className="textarea textarea-bordered textarea-xs w-full focus:textarea-primary resize-none"
                  rows={1}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="form-control flex-1">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    placeholder="Cooldown (min)"
                    value={newAlert.cooldownMinutes}
                    onChange={(e) => setNewAlert({ ...newAlert, cooldownMinutes: parseInt(e.target.value) || 60 })}
                    className="input input-bordered input-xs focus:input-primary"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-xs px-4"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AlertSettings;