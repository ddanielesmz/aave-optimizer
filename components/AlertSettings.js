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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Card - Consistent with dashboard style */}
          <div className="relative bg-base-100 rounded-2xl border border-base-300 shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-base-content font-semibold tracking-tight">
                  Alert Settings
                </h3>
                <span className="badge badge-outline badge-sm">{getWidgetDisplayName()}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-square btn-ghost btn-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Current Value Display */}
            <div className="mb-6 p-4 bg-base-200 rounded-xl border border-base-300">
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70 font-medium">Current Value:</span>
                <span className="font-semibold text-base-content text-lg">
                  {currentValue?.toFixed(4) || "N/A"}
                </span>
              </div>
            </div>

            {/* Existing Alerts */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-base-content mb-3">Configured Alerts:</h4>
              {alerts.length === 0 ? (
                <div className="text-center py-6 text-base-content/60">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.828 7l2.586-2.586a2 2 0 012.828 0L12 6l1.586-1.586a2 2 0 012.828 0L19 7v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zM4 7h16M8 11h8M8 15h4" />
                  </svg>
                  <p className="text-sm">No alerts configured</p>
                  <p className="text-xs text-base-content/40 mt-1">Debug: {alerts.length} alerts loaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div
                      key={alert._id || alert.id || `alert-${index}`}
                      className="flex items-center justify-between p-4 bg-base-200 rounded-xl border border-base-300"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-base-content">{alert.alertName}</div>
                        <div className="text-xs text-base-content/70 mt-1">
                          {getConditionSymbol(alert.condition)} {alert.threshold} • @{alert.telegramUsername.replace('@', '')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={alert.isActive}
                          onChange={(e) => toggleAlert(alert._id || alert.id, e.target.checked)}
                          className="toggle toggle-sm toggle-primary"
                        />
                        <button
                          onClick={() => deleteAlert(alert._id || alert.id)}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Alert Form */}
            <form onSubmit={createAlert} className="space-y-4">
              <h4 className="text-sm font-medium text-base-content">Create New Alert:</h4>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-xs font-medium">Alert Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Critical Health Factor"
                  value={newAlert.alertName}
                  onChange={(e) => setNewAlert({ ...newAlert, alertName: e.target.value })}
                  className="input input-bordered input-sm w-full focus:input-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-medium">Condition</span>
                  </label>
                  <select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                    className="select select-bordered select-sm focus:select-primary"
                  >
                    <option value="less_than">Less than</option>
                    <option value="greater_than">Greater than</option>
                    <option value="equals">Equals</option>
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-medium">Threshold</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0.0000"
                    value={newAlert.threshold}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string, numbers, and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setNewAlert({ ...newAlert, threshold: value });
                      }
                    }}
                    className="input input-bordered input-sm focus:input-primary"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-xs font-medium">Telegram Username</span>
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={newAlert.telegramUsername}
                  onChange={(e) => setNewAlert({ ...newAlert, telegramUsername: e.target.value })}
                  className="input input-bordered input-sm w-full focus:input-primary"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-xs font-medium">Custom Message (Optional)</span>
                </label>
                <textarea
                  placeholder="Message you'll receive with the alert..."
                  value={newAlert.customMessage}
                  onChange={(e) => setNewAlert({ ...newAlert, customMessage: e.target.value })}
                  className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary"
                  rows={2}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-xs font-medium">Cooldown (minutes)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={newAlert.cooldownMinutes}
                  onChange={(e) => setNewAlert({ ...newAlert, cooldownMinutes: parseInt(e.target.value) || 60 })}
                  className="input input-bordered input-sm w-full focus:input-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-sm w-full mt-4"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Creating...
                  </>
                ) : (
                  "Create Alert"
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AlertSettings;