"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import apiClient from "@/libs/api";

const AlertSettings = ({ widgetType, currentValue, widgetName }) => {
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingAlert, setTogglingAlert] = useState(null); // Track which alert is being toggled
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); // 'success', 'error', null
  const [showTelegramGuide, setShowTelegramGuide] = useState(true);
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

  // Load saved Telegram username from localStorage
  useEffect(() => {
    if (isClient) {
      const savedUsername = localStorage.getItem('telegramUsername');
      if (savedUsername) {
        setNewAlert(prev => ({
          ...prev,
          telegramUsername: savedUsername
        }));
      }
    }
  }, [isClient]);

  const loadAlerts = useCallback(async () => {
    try {
      const response = await apiClient.get(`/alerts?widgetType=${widgetType}`);
      console.log("Alert response:", response); // Debug log
      setAlerts(response || []);
    } catch (error) {
      console.error("Error loading alerts:", error);
      setAlerts([]); // Set empty array on error
    }
  }, [widgetType]);

  // Load existing alerts
  useEffect(() => {
    if (isClient) {
      loadAlerts();
    }
  }, [isClient, loadAlerts]);

  // Load alerts when modal opens
  useEffect(() => {
    if (isOpen && isClient) {
      loadAlerts();
    }
  }, [isOpen, isClient, loadAlerts]);

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
    setTogglingAlert(alertId);
    try {
      console.log("Toggling alert:", { alertId, isActive }); // Debug log
      const response = await apiClient.patch(`/alerts/${alertId}`, { isActive });
      console.log("Toggle response:", response); // Debug log
      await loadAlerts();
    } catch (error) {
      console.error("Error updating alert:", error);
      alert(`Error updating alert: ${error.message || 'Unknown error'}`);
    } finally {
      setTogglingAlert(null);
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

  const testTelegramConnection = async () => {
    if (!newAlert.telegramUsername.trim()) {
      alert("Please enter your Telegram username first");
      return;
    }

    // Save username to localStorage
    localStorage.setItem('telegramUsername', newAlert.telegramUsername);

    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      const response = await apiClient.post("/alerts/test-telegram", {
        telegramUsername: newAlert.telegramUsername.replace(/^@+/, ""),
        testMessage: `✅ Connection successful! You will now receive ${getWidgetDisplayName()} alerts from Aave Optimizer Dashboard.`
      });

      if (response.success) {
        setConnectionStatus('success');
        // Hide guide after successful connection
        setTimeout(() => {
          setConnectionStatus(null);
          setShowTelegramGuide(false);
        }, 2000);
      } else {
        setConnectionStatus('error');
        setTimeout(() => setConnectionStatus(null), 3000);
      }
    } catch (error) {
      console.error("Error testing Telegram connection:", error);
      setConnectionStatus('error');
      setTimeout(() => setConnectionStatus(null), 3000);
    } finally {
      setIsTestingConnection(false);
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
    if (currentValue === null || currentValue === undefined || isNaN(currentValue)) return 'text-base-content/60';
    
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

  // Get threshold placeholder based on widget type
  const getThresholdPlaceholder = () => {
    switch (widgetType) {
      case 'healthFactor':
        return 'For example: 1.5';
      case 'ltv':
        return 'For example: 0.4550 (45.5%)';
      case 'netAPY':
        return '5.0 (APY %)';
      default:
        return '0.0000';
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
                  {currentValue !== null && currentValue !== undefined && !isNaN(currentValue) 
                    ? currentValue.toFixed(4) 
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Telegram Setup Guide */}
            {showTelegramGuide && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  {/* Telegram Icon */}
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  
                  {/* Guide Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Configure Telegram to receive notifications
                      </h4>
                      <button
                        onClick={() => setShowTelegramGuide(false)}
                        className="btn btn-ghost btn-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800 p-1"
                        title="Hide this guide"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      To receive alerts on Telegram, you need to configure the bot first:
                    </p>
                    
                    {/* Steps */}
                    <div className="space-y-1 mb-3">
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        1. Click "Open Telegram Bot" below
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        2. Send <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/start</code> to the bot to begin
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        3. Enter your Telegram username in the field below
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        4. Click "Test Connection" to verify
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <a
                        href="https://t.me/AaveOptimizerBot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 text-white"
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        Open Telegram Bot
                      </a>
                      
                      <button
                        onClick={testTelegramConnection}
                        disabled={isTestingConnection || !newAlert.telegramUsername.trim()}
                        className={`btn btn-sm ${
                          connectionStatus === 'success' 
                            ? 'btn-success' 
                            : connectionStatus === 'error' 
                            ? 'btn-error' 
                            : 'btn-outline'
                        }`}
                      >
                        {isTestingConnection ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : connectionStatus === 'success' ? (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : connectionStatus === 'error' ? (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {connectionStatus === 'success' ? 'Connected!' : 
                         connectionStatus === 'error' ? 'Error' : 
                         'Test Connection'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                          disabled={togglingAlert === (alert._id || alert.id)}
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full"></div>
                  <h4 className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Create Alert</h4>
                </div>
                {!showTelegramGuide && (
                  <button
                    type="button"
                    onClick={() => setShowTelegramGuide(true)}
                    className="btn btn-ghost btn-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Show Telegram setup guide"
                  >
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Show Telegram Guide
                  </button>
                )}
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
                    placeholder={getThresholdPlaceholder()}
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
                    onChange={(e) => {
                      const username = e.target.value;
                      setNewAlert({ ...newAlert, telegramUsername: username });
                      // Save to localStorage as user types
                      if (username.trim()) {
                        localStorage.setItem('telegramUsername', username);
                      }
                    }}
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