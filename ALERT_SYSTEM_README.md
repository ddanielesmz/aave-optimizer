# Sistema di Alert per Dashboard DeFi

Questo sistema permette di configurare alert personalizzati per i widget della dashboard che inviano notifiche via Telegram quando i valori raggiungono determinate soglie.

## 🚀 Funzionalità

- **Alert personalizzabili** per Health Factor, LTV Ratio e Net APY
- **Notifiche Telegram** in tempo reale
- **Cooldown configurabile** per evitare spam
- **Interfaccia intuitiva** integrata nei widget
- **Monitoraggio automatico** ogni 5 minuti

## 📋 Prerequisiti

### 1. Bot Telegram

1. Crea un bot Telegram:
   - Scrivi a [@BotFather](https://t.me/botfather)
   - Usa il comando `/newbot`
   - Segui le istruzioni per creare il bot
   - Salva il **Bot Token** che riceverai

2. Ottieni il tuo Chat ID:
   - Scrivi al tuo bot appena creato
   - Vai su `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Trova il `chat.id` nella risposta

### 2. Variabili d'Ambiente

Aggiungi queste variabili al tuo file `.env.local`:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
ALERT_CHECK_INTERVAL=300000  # 5 minuti in millisecondi (opzionale)
```

## 🛠️ Installazione

### 1. Database

Il sistema crea automaticamente il modello `Alert` in MongoDB. Assicurati che MongoDB sia configurato correttamente.

### 2. Avvio del Sistema

Il sistema di alert si avvia automaticamente all'avvio dell'applicazione se `TELEGRAM_BOT_TOKEN` è configurato.

## 📱 Come Usare

### 1. Configurare un Alert

1. Vai alla dashboard
2. Trova il widget per cui vuoi configurare un alert (es. Health Factor)
3. Clicca sull'icona 🔔 nell'angolo del widget
4. Compila il form:
   - **Nome Alert**: Nome descrittivo per il tuo alert
   - **Condizione**: Maggiore di, Minore di, o Uguale a
   - **Soglia**: Il valore che deve essere raggiunto
   - **Chat ID Telegram**: Il tuo Chat ID Telegram
   - **Messaggio personalizzato**: Opzionale
   - **Cooldown**: Minuti tra alert consecutivi (default: 60)

### 2. Esempi di Configurazione

#### Health Factor Alert
- **Nome**: "Health Factor Critico"
- **Condizione**: Minore di
- **Soglia**: 1.5
- **Significato**: Alert quando l'Health Factor scende sotto 1.5

#### LTV Alert
- **Nome**: "LTV Alto"
- **Condizione**: Maggiore di
- **Soglia**: 0.8
- **Significato**: Alert quando il Loan-to-Value supera l'80%

#### Net APY Alert
- **Nome**: "APY Negativo"
- **Condizione**: Minore di
- **Soglia**: 0
- **Significato**: Alert quando l'APY diventa negativo

### 3. Gestire gli Alert

- **Attivare/Disattivare**: Usa il checkbox accanto a ogni alert
- **Eliminare**: Clicca sull'icona 🗑️
- **Testare**: Usa il pulsante "Test Alert" per verificare la configurazione

## 🔧 Integrazione nei Widget

Per aggiungere il sistema di alert a un nuovo widget:

```jsx
import AlertSettings from '@/components/AlertSettings';

// Nel tuo widget component
<div className="flex items-center gap-2">
  <h3>Nome Widget</h3>
  <AlertSettings
    widgetType="healthFactor" // o "ltv", "netAPY"
    currentValue={currentValue}
    widgetName="Nome Widget"
  />
</div>
```

## 📊 Tipi di Widget Supportati

| Widget Type | Descrizione | Valore Monitorato |
|-------------|-------------|-------------------|
| `healthFactor` | Health Factor Aave | Valore numerico (es. 1.5) |
| `ltv` | Loan-to-Value Ratio | Percentuale (es. 0.75) |
| `netAPY` | Net Annual Percentage Yield | Percentuale (es. 0.05) |

## 🚨 Messaggi di Alert

I messaggi Telegram includono:
- Nome dell'alert
- Widget e valore attuale
- Condizione triggerata
- Timestamp
- Messaggio personalizzato (se configurato)
- Link alla dashboard

Esempio:
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

## 🔍 Monitoraggio e Debug

### Log del Sistema

Il sistema scrive log dettagliati:
- Avvio/arresto del monitoraggio
- Controlli periodici degli alert
- Alert triggerati
- Errori nelle notifiche

### Test Manuale

Puoi testare un alert specifico usando l'API:
```bash
POST /api/alerts/{alertId}/test
```

## ⚙️ Configurazione Avanzata

### Intervallo di Controllo

Modifica `ALERT_CHECK_INTERVAL` per cambiare la frequenza dei controlli:
- Default: 300000ms (5 minuti)
- Minimo consigliato: 60000ms (1 minuto)
- Massimo consigliato: 1800000ms (30 minuti)

### Cooldown per Alert

Ogni alert ha un cooldown configurabile per evitare spam:
- Default: 60 minuti
- Range: 1-1440 minuti (24 ore)

## 🛡️ Sicurezza

- Gli alert sono legati all'utente autenticato
- Solo il proprietario può modificare/eliminare i propri alert
- Validazione completa dei dati di input
- Rate limiting per le API

## 🐛 Troubleshooting

### Bot Telegram non funziona
1. Verifica che `TELEGRAM_BOT_TOKEN` sia configurato correttamente
2. Controlla che il bot sia attivo
3. Verifica che il Chat ID sia corretto

### Alert non vengono triggerati
1. Controlla che l'alert sia attivo (checkbox)
2. Verifica la condizione e soglia
3. Controlla i log per errori
4. Testa l'alert manualmente

### Valori non aggiornati
1. Verifica la connessione ai dati Aave
2. Controlla che il sistema di monitoraggio sia attivo
3. Verifica i log per errori di connessione

## 📈 Roadmap

- [ ] Supporto per più tipi di widget
- [ ] Alert via email
- [ ] Dashboard dedicata per gestire alert
- [ ] Alert basati su trend (es. "Health Factor in calo")
- [ ] Integrazione con altri protocolli DeFi
- [ ] Alert multipli per lo stesso widget
- [ ] Template di messaggi personalizzabili
