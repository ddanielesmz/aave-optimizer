import connectMongo from "@/libs/mongo";
import Alert from "@/models/Alert";
import telegramNotifier from "@/libs/telegram";
import { useAaveHealthFactor } from "@/libs/useAaveData";
import { useAaveUserAccountDataRealtime } from "@/libs/useAaveData";

class AlertMonitor {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 5 * 60 * 1000; // 5 minuti
    this.intervalId = null;
  }

  /**
   * Avvia il monitoraggio degli alert
   */
  start() {
    if (this.isRunning) {
      console.log("AlertMonitor già in esecuzione");
      return;
    }

    console.log("Avvio AlertMonitor...");
    this.isRunning = true;
    
    // Esegui controllo immediato
    this.checkAlerts();
    
    // Poi esegui controlli periodici
    this.intervalId = setInterval(() => {
      this.checkAlerts();
    }, this.checkInterval);
  }

  /**
   * Ferma il monitoraggio degli alert
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log("Arresto AlertMonitor...");
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Controlla tutti gli alert attivi
   */
  async checkAlerts() {
    try {
      await connectMongo();
      
      // Recupera tutti gli alert attivi
      const activeAlerts = await Alert.find({ isActive: true });
      
      if (activeAlerts.length === 0) {
        console.log("Nessun alert attivo da controllare");
        return;
      }

      console.log(`Controllo ${activeAlerts.length} alert attivi...`);

      // Raggruppa alert per tipo di widget
      const alertsByWidget = this.groupAlertsByWidget(activeAlerts);

      // Controlla ogni gruppo di widget
      for (const [widgetType, alerts] of Object.entries(alertsByWidget)) {
        await this.checkWidgetAlerts(widgetType, alerts);
      }

    } catch (error) {
      console.error("Errore nel controllo alert:", error);
    }
  }

  /**
   * Raggruppa gli alert per tipo di widget
   */
  groupAlertsByWidget(alerts) {
    return alerts.reduce((groups, alert) => {
      if (!groups[alert.widgetType]) {
        groups[alert.widgetType] = [];
      }
      groups[alert.widgetType].push(alert);
      return groups;
    }, {});
  }

  /**
   * Controlla gli alert per un tipo di widget specifico
   */
  async checkWidgetAlerts(widgetType, alerts) {
    try {
      let currentValue = null;
      let widgetName = "";

      // Recupera il valore attuale del widget
      switch (widgetType) {
        case "healthFactor":
          currentValue = await this.getHealthFactorValue();
          widgetName = "Health Factor";
          break;
        case "ltv":
          currentValue = await this.getLTVValue();
          widgetName = "LTV Ratio";
          break;
        case "netAPY":
          currentValue = await this.getNetAPYValue();
          widgetName = "Net APY";
          break;
        default:
          console.warn(`Tipo widget non supportato: ${widgetType}`);
          return;
      }

      if (currentValue === null) {
        console.warn(`Impossibile recuperare valore per ${widgetType}`);
        return;
      }

      console.log(`${widgetName}: ${currentValue}`);

      // Controlla ogni alert per questo widget
      for (const alert of alerts) {
        await this.checkSingleAlert(alert, currentValue, widgetName);
      }

    } catch (error) {
      console.error(`Errore nel controllo alert per ${widgetType}:`, error);
    }
  }

  /**
   * Controlla un singolo alert
   */
  async checkSingleAlert(alert, currentValue, widgetName) {
    try {
      // Verifica se l'alert può essere triggerato (cooldown)
      if (!alert.canTrigger()) {
        return;
      }

      // Verifica se la condizione è soddisfatta
      if (!alert.checkCondition(currentValue)) {
        return;
      }

      console.log(`🚨 Alert triggerato: ${alert.alertName} (${currentValue} ${alert.condition} ${alert.threshold})`);

      // Invia notifica Telegram
      const result = await telegramNotifier.sendAlert(alert, currentValue, widgetName);
      
      if (result.success) {
        // Aggiorna timestamp dell'ultimo trigger
        await Alert.findByIdAndUpdate(alert._id, {
          lastTriggered: new Date(),
        });
        
        console.log(`✅ Notifica inviata per alert: ${alert.alertName}`);
      } else {
        console.error(`❌ Errore nell'invio notifica per alert: ${alert.alertName}`, result.error);
      }

    } catch (error) {
      console.error(`Errore nel controllo alert ${alert.alertName}:`, error);
    }
  }

  /**
   * Recupera il valore attuale dell'Health Factor
   */
  async getHealthFactorValue() {
    try {
      // Qui dovresti implementare la logica per recuperare il valore reale
      // Per ora restituisco un valore mock
      // In produzione, dovresti usare le stesse funzioni dei widget
      return Math.random() * 2; // Mock value tra 0 e 2
    } catch (error) {
      console.error("Errore nel recupero Health Factor:", error);
      return null;
    }
  }

  /**
   * Recupera il valore attuale dell'LTV
   */
  async getLTVValue() {
    try {
      // Mock value tra 0 e 1
      return Math.random();
    } catch (error) {
      console.error("Errore nel recupero LTV:", error);
      return null;
    }
  }

  /**
   * Recupera il valore attuale del Net APY
   */
  async getNetAPYValue() {
    try {
      // Mock value tra -5% e 15%
      return (Math.random() - 0.5) * 20;
    } catch (error) {
      console.error("Errore nel recupero Net APY:", error);
      return null;
    }
  }

  /**
   * Testa un singolo alert manualmente
   */
  async testAlert(alertId) {
    try {
      await connectMongo();
      
      const alert = await Alert.findById(alertId);
      if (!alert) {
        throw new Error("Alert non trovato");
      }

      // Simula un valore che triggera l'alert
      let testValue;
      switch (alert.condition) {
        case "less_than":
          testValue = alert.threshold - 0.1;
          break;
        case "greater_than":
          testValue = alert.threshold + 0.1;
          break;
        case "equals":
          testValue = alert.threshold;
          break;
        default:
          testValue = alert.threshold;
      }

      const widgetName = this.getWidgetDisplayName(alert.widgetType);
      await this.checkSingleAlert(alert, testValue, widgetName);

    } catch (error) {
      console.error("Errore nel test alert:", error);
      throw error;
    }
  }

  /**
   * Ottiene il nome display del widget
   */
  getWidgetDisplayName(widgetType) {
    switch (widgetType) {
      case "healthFactor":
        return "Health Factor";
      case "ltv":
        return "LTV Ratio";
      case "netAPY":
        return "Net APY";
      default:
        return widgetType;
    }
  }
}

export default new AlertMonitor();
