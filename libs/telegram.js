import axios from "axios";

class TelegramNotifier {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Invia una notifica Telegram
   * @param {string} chatId - ID della chat Telegram
   * @param {string} message - Messaggio da inviare
   * @param {Object} options - Opzioni aggiuntive
   */
  async sendMessage(chatId, message, options = {}) {
    if (!this.botToken) {
      console.error("TELEGRAM_BOT_TOKEN non configurato");
      return { success: false, error: "Bot token non configurato" };
    }

    try {
      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...options,
      };

      const response = await axios.post(`${this.baseUrl}/sendMessage`, payload);
      
      return {
        success: true,
        messageId: response.data.result.message_id,
      };
    } catch (error) {
      console.error("Errore nell'invio notifica Telegram:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  /**
   * Formatta un messaggio di alert per un widget
   * @param {Object} alert - Configurazione dell'alert
   * @param {number} currentValue - Valore attuale
   * @param {string} widgetName - Nome del widget
   */
  formatAlertMessage(alert, currentValue, widgetName) {
    const timestamp = new Date().toLocaleString("it-IT");
    const conditionText = this.getConditionText(alert.condition);
    
    let message = `🚨 <b>ALERT ${alert.alertName}</b>\n\n`;
    message += `📊 <b>Widget:</b> ${widgetName}\n`;
    message += `📈 <b>Valore attuale:</b> ${currentValue.toFixed(4)}\n`;
    message += `⚖️ <b>Condizione:</b> ${conditionText} ${alert.threshold}\n`;
    message += `⏰ <b>Timestamp:</b> ${timestamp}\n`;
    
    if (alert.customMessage) {
      message += `\n💬 <b>Messaggio personalizzato:</b>\n${alert.customMessage}\n`;
    }
    
    message += `\n🔗 <b>Dashboard:</b> ${process.env.NEXTAUTH_URL}/dashboard`;
    
    return message;
  }

  /**
   * Converte la condizione in testo leggibile
   */
  getConditionText(condition) {
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
  }

  /**
   * Invia un alert per un widget specifico
   * @param {Object} alert - Configurazione dell'alert
   * @param {number} currentValue - Valore attuale
   * @param {string} widgetName - Nome del widget
   */
  async sendAlert(alert, currentValue, widgetName) {
    const message = this.formatAlertMessage(alert, currentValue, widgetName);
    return await this.sendMessage(alert.telegramChatId, message);
  }

  /**
   * Verifica se il bot è configurato correttamente
   */
  async testConnection() {
    if (!this.botToken) {
      return { success: false, error: "Bot token non configurato" };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return {
        success: true,
        botInfo: response.data.result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }
}

export default new TelegramNotifier();
