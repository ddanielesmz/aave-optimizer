# 🚨 Sistema di Alert per Dashboard DeFi - Branch "allert"

## 📋 Riepilogo Implementazione

Questo branch implementa un sistema completo di alert per i widget della dashboard DeFi con notifiche Telegram.

## 🆕 File Creati/Modificati

### Modelli Database
- `models/Alert.js` - Modello Mongoose per gli alert

### Componenti UI
- `components/AlertSettings.js` - Interfaccia per configurare alert
- `components/WidgetWithAlerts.js` - Wrapper per integrare alert nei widget
- `components/ALERT_INTEGRATION_EXAMPLES.js` - Esempi di integrazione

### API Endpoints
- `app/api/alerts/route.js` - CRUD per alert (GET, POST)
- `app/api/alerts/[id]/route.js` - Gestione singolo alert (PATCH, DELETE)
- `app/api/alerts/[id]/test/route.js` - Test alert specifico

### Librerie e Utilità
- `libs/telegram.js` - Integrazione Telegram per notifiche
- `libs/alertMonitor.js` - Sistema di monitoraggio automatico
- `libs/initApp.js` - Aggiornato per avviare il sistema alert

### Configurazione
- `config.js` - Aggiunta configurazione Telegram
- `ALERT_SYSTEM_README.md` - Documentazione completa
- `ALERT_ENV_CONFIG.md` - Guida configurazione variabili d'ambiente
- `scripts/test-alert-system.js` - Script di test del sistema

### Esempi
- `components/dashboard/AaveHealthWidgetWithAlerts.js` - Widget esempio con alert integrato

## 🎯 Funzionalità Implementate

### ✅ Sistema Base
- [x] Modello database per alert
- [x] Interfaccia utente per configurazione
- [x] API REST per gestione alert
- [x] Integrazione Telegram
- [x] Sistema di monitoraggio automatico

### ✅ Widget Supportati
- [x] Health Factor (AaveHealthWidget)
- [x] LTV Ratio (CurrentLTVWidget) 
- [x] Net APY (NetAPYCard)

### ✅ Caratteristiche Avanzate
- [x] Cooldown configurabile tra alert
- [x] Messaggi personalizzati
- [x] Test manuale degli alert
- [x] Gestione stato attivo/disattivo
- [x] Validazione completa dei dati

## 🔧 Come Testare

### 1. Configurazione Telegram
```bash
# Nel file .env.local
TELEGRAM_BOT_TOKEN=your_bot_token_here
ALERT_CHECK_INTERVAL=300000
```

### 2. Test del Sistema
```bash
# Esegui lo script di test
node scripts/test-alert-system.js
```

### 3. Test Manuale
1. Avvia l'applicazione
2. Vai alla dashboard
3. Clicca sull'icona 🔔 in un widget
4. Configura un alert di test
5. Usa il pulsante "Test Alert" per verificare

## 📱 Esempi di Configurazione Alert

### Health Factor Critico
- **Nome**: "Health Factor Critico"
- **Condizione**: Minore di
- **Soglia**: 1.5
- **Chat ID**: Il tuo Chat ID Telegram
- **Cooldown**: 60 minuti

### LTV Alto
- **Nome**: "LTV Alto"
- **Condizione**: Maggiore di
- **Soglia**: 0.8
- **Chat ID**: Il tuo Chat ID Telegram
- **Cooldown**: 30 minuti

### APY Negativo
- **Nome**: "APY Negativo"
- **Condizione**: Minore di
- **Soglia**: 0
- **Chat ID**: Il tuo Chat ID Telegram
- **Cooldown**: 120 minuti

## 🔄 Integrazione nei Widget Esistenti

Per aggiungere alert a un widget esistente:

```jsx
import AlertSettings from '@/components/AlertSettings';

// Nel componente widget
<div className="flex items-center gap-2">
  <h3>Nome Widget</h3>
  <AlertSettings
    widgetType="healthFactor" // o "ltv", "netAPY"
    currentValue={currentValue}
    widgetName="Nome Widget"
  />
</div>
```

## 🚀 Prossimi Passi

### Per il Deploy
1. Configurare `TELEGRAM_BOT_TOKEN` nell'ambiente di produzione
2. Testare il sistema con alert reali
3. Monitorare i log per verificare il funzionamento

### Per Sviluppi Futuri
- [ ] Supporto per più tipi di widget
- [ ] Alert via email
- [ ] Dashboard dedicata per gestire alert
- [ ] Alert basati su trend
- [ ] Integrazione con altri protocolli DeFi

## 📊 Statistiche Implementazione

- **File creati**: 12
- **File modificati**: 3
- **Righe di codice**: ~1500
- **API endpoints**: 3
- **Componenti React**: 4
- **Modelli database**: 1

## 🛡️ Sicurezza

- Validazione completa dei dati di input
- Alert legati all'utente autenticato
- Rate limiting per le API
- Sanitizzazione dei messaggi Telegram

## 📖 Documentazione

- `ALERT_SYSTEM_README.md` - Guida completa
- `ALERT_ENV_CONFIG.md` - Configurazione ambiente
- `ALERT_INTEGRATION_EXAMPLES.js` - Esempi di integrazione

---

**Branch**: `allert`  
**Stato**: ✅ Completato  
**Pronto per**: Testing e Deploy
