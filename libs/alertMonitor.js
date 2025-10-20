import connectMongo from "@/libs/mongoose";
import Alert from "@/models/Alert";
import telegramNotifier from "@/libs/telegram";

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

    console.log("🚨 Avvio AlertMonitor...");
    this.isRunning = true;
    
    // Esegui controllo immediato
    this.checkAlerts();
    
    // Poi esegui controlli periodici
    this.intervalId = setInterval(() => {
      this.checkAlerts();
    }, this.checkInterval);

    console.log(`✅ AlertMonitor avviato - controlli ogni ${this.checkInterval / 1000 / 60} minuti`);
  }

  /**
   * Ferma il monitoraggio degli alert
   */
  stop() {
    if (!this.isRunning) {
      console.log("AlertMonitor non è in esecuzione");
      return;
    }

    console.log("🛑 Fermata AlertMonitor...");
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("✅ AlertMonitor fermato");
  }

  /**
   * Controlla tutti gli alert attivi
   */
  async checkAlerts() {
    try {
      console.log("🔍 Controllo alert attivi...");
      
      await connectMongo();
      
      // Recupera tutti gli alert attivi
      const activeAlerts = await Alert.find({ isActive: true });
      
      if (activeAlerts.length === 0) {
        console.log("📭 Nessun alert attivo trovato");
        return;
      }

      console.log(`📊 Trovati ${activeAlerts.length} alert attivi`);

      // Per ora, simuliamo alcuni valori per testare il sistema
      // In produzione, questi valori dovrebbero venire da API esterne
      const mockValues = {
        healthFactor: 1.2, // Valore critico per test
        ltv: 0.6,
        netAPY: 0.05
      };

      for (const alert of activeAlerts) {
        await this.checkSingleAlert(alert, mockValues);
      }

    } catch (error) {
      console.error("❌ Errore nel controllo alert:", error);
    }
  }

  /**
   * Controlla un singolo alert
   */
  async checkSingleAlert(alert, currentValues) {
    try {
      const { widgetType, condition, threshold, cooldownMinutes, lastTriggered } = alert;
      
      // Ottieni il valore corrente per questo widget
      const currentValue = currentValues[widgetType];
      
      if (currentValue === undefined) {
        console.log(`⚠️ Valore non disponibile per widget: ${widgetType}`);
        return;
      }

      // Verifica se l'alert può essere triggerato (controlla cooldown)
      if (lastTriggered) {
        const timeSinceLastTrigger = Date.now() - new Date(lastTriggered).getTime();
        const cooldownMs = cooldownMinutes * 60 * 1000;
        
        if (timeSinceLastTrigger < cooldownMs) {
          console.log(`⏳ Alert ${alert.alertName} in cooldown (${Math.round((cooldownMs - timeSinceLastTrigger) / 1000 / 60)} min rimanenti)`);
          return;
        }
      }

      // Verifica se la condizione è soddisfatta
      let conditionMet = false;
      
      switch (condition) {
        case "greater_than":
          conditionMet = currentValue > threshold;
          break;
        case "less_than":
          conditionMet = currentValue < threshold;
          break;
        case "equals":
          conditionMet = Math.abs(currentValue - threshold) < 0.0001; // Tolleranza per float
          break;
      }

      if (conditionMet) {
        console.log(`🚨 Alert triggerato: ${alert.alertName} (${currentValue} ${condition} ${threshold})`);
        await this.triggerAlert(alert, currentValue);
      } else {
        console.log(`✅ Alert ${alert.alertName} OK (${currentValue} non ${condition} ${threshold})`);
      }

    } catch (error) {
      console.error(`❌ Errore nel controllo alert ${alert.alertName}:`, error);
    }
  }

  /**
   * Triggera un alert
   */
  async triggerAlert(alert, currentValue) {
    try {
      // Invia notifica Telegram
      const result = await telegramNotifier.sendAlert(alert, currentValue, this.getWidgetDisplayName(alert.widgetType));
      
      if (result.success) {
        console.log(`📱 Notifica Telegram inviata per alert: ${alert.alertName}`);
        
        // Aggiorna timestamp ultimo trigger
        await Alert.findByIdAndUpdate(alert._id, {
          lastTriggered: new Date()
        });
        
      } else {
        console.error(`❌ Errore invio Telegram per alert ${alert.alertName}:`, result.error);
      }

    } catch (error) {
      console.error(`❌ Errore nel trigger alert ${alert.alertName}:`, error);
    }
  }

  /**
   * Testa un alert specifico
   */
  async testAlert(alertId) {
    try {
      await connectMongo();
      
      const alert = await Alert.findById(alertId);
      if (!alert) {
        throw new Error("Alert non trovato");
      }

      console.log(`🧪 Test alert: ${alert.alertName}`);
      
      // Simula un valore che triggera l'alert
      const testValue = alert.threshold - 0.1; // Valore leggermente sotto la soglia
      
      await this.triggerAlert(alert, testValue);
      
      console.log(`✅ Test alert completato per: ${alert.alertName}`);
      
    } catch (error) {
      console.error(`❌ Errore nel test alert:`, error);
      throw error;
    }
  }

  /**
   * Ottiene il nome display per un widget
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

  /**
   * Verifica se il monitoraggio è attivo
   */
  isActive() {
    return this.isRunning;
  }
}

// Istanza singleton
const alertMonitor = new AlertMonitor();

export default alertMonitor;