# 🚨 Guida Rapida: Come Usare gli Alert nella Dashboard

## ✅ Integrazione Completata!

Ho appena integrato il sistema di alert in tutti i widget principali della dashboard. Ora puoi vedere l'icona 🔔 in ogni widget!

## 📱 Come Configurare un Alert

### 1. Trova l'Icona Alert
- Vai alla dashboard (`/dashboard`)
- Cerca l'icona **🔔** nell'angolo di ogni widget
- È presente in:
  - **Health Factor** widget
  - **Current LTV** widget  
  - **Net APY** widget

### 2. Configura l'Alert
1. **Clicca sull'icona 🔔**
2. **Compila il form**:
   - **Nome Alert**: Es. "Health Factor Critico"
   - **Condizione**: Minore di / Maggiore di / Uguale a
   - **Soglia**: Il valore che deve essere raggiunto
   - **Chat ID Telegram**: Il tuo Chat ID Telegram
   - **Messaggio personalizzato**: Opzionale
   - **Cooldown**: Minuti tra alert consecutivi

### 3. Esempi di Configurazione

#### 🏥 Health Factor Alert
- **Nome**: "Health Factor Critico"
- **Condizione**: Minore di
- **Soglia**: 1.5
- **Significato**: Alert quando sei vicino alla liquidazione

#### 💰 LTV Alert  
- **Nome**: "LTV Alto"
- **Condizione**: Maggiore di
- **Soglia**: 0.8
- **Significato**: Alert quando il debito supera l'80%

#### 📈 Net APY Alert
- **Nome**: "APY Negativo"
- **Condizione**: Minore di
- **Soglia**: 0
- **Significato**: Alert quando stai perdendo soldi

## 🔧 Prerequisiti

### Bot Telegram
1. Crea un bot con [@BotFather](https://t.me/botfather)
2. Aggiungi `TELEGRAM_BOT_TOKEN` al file `.env.local`
3. Ottieni il tuo Chat ID Telegram

### Variabili d'Ambiente
```bash
# Nel file .env.local
TELEGRAM_BOT_TOKEN=your_bot_token_here
ALERT_CHECK_INTERVAL=300000  # 5 minuti (opzionale)
```

## 🧪 Come Testare

### 1. Test Sistema Completo
```bash
node scripts/test-alert-system.js
```

### 2. Test Integrazione Widget
```bash
node scripts/test-widget-integration.js
```

### 3. Test Manuale
1. Avvia l'app: `npm run dev`
2. Vai alla dashboard
3. Configura un alert di test
4. Usa il pulsante "Test Alert" per verificare

## 📊 Gestione Alert

### Attivare/Disattivare
- Usa il checkbox accanto a ogni alert
- Gli alert disattivati non vengono controllati

### Eliminare Alert
- Clicca sull'icona 🗑️ accanto all'alert
- Conferma l'eliminazione

### Testare Alert
- Usa il pulsante "Test Alert" per verificare la configurazione
- Simula il trigger dell'alert

## 🚨 Messaggi Telegram

Quando un alert viene triggerato, riceverai un messaggio come:

```
🚨 ALERT Health Factor Critico

📊 Widget: Health Factor
📈 Valore attuale: 1.45
⚖️ Condizione: minore di 1.5
⏰ Timestamp: 15/12/2024, 14:30:25

💬 Messaggio personalizzato:
Il tuo Health Factor è sceso sotto la soglia di sicurezza!

🔗 Dashboard: https://aaveoptimizer.com/dashboard
```

## 🔍 Troubleshooting

### Non vedo l'icona 🔔
- Assicurati di essere nella dashboard (`/dashboard`)
- Controlla che l'app sia avviata correttamente
- Verifica che i widget siano caricati

### Alert non funzionano
- Controlla che `TELEGRAM_BOT_TOKEN` sia configurato
- Verifica che il Chat ID sia corretto
- Controlla i log dell'applicazione

### Bot Telegram non risponde
- Verifica che il bot sia attivo
- Controlla che il token sia corretto
- Assicurati di aver scritto al bot almeno una volta

## 📈 Prossimi Passi

1. **Configura il tuo bot Telegram**
2. **Imposta alert per i valori critici**
3. **Testa il sistema con alert di prova**
4. **Monitora i log per verificare il funzionamento**

---

**🎉 Il sistema è ora completamente funzionale!**  
Tutti i widget hanno l'icona 🔔 per configurare alert personalizzati.
