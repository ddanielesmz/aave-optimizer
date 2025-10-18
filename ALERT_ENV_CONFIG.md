# Configurazione Variabili d'Ambiente per Sistema Alert

## Variabili Richieste

### TELEGRAM_BOT_TOKEN
- **Descrizione**: Token del bot Telegram per inviare notifiche
- **Come ottenerlo**: 
  1. Scrivi a [@BotFather](https://t.me/botfather) su Telegram
  2. Usa il comando `/newbot`
  3. Segui le istruzioni per creare il bot
  4. Salva il token che riceverai
- **Formato**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- **Esempio**: `TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

## Variabili Opzionali

### ALERT_CHECK_INTERVAL
- **Descrizione**: Intervallo di controllo degli alert in millisecondi
- **Default**: `300000` (5 minuti)
- **Range consigliato**: `60000` - `1800000` (1-30 minuti)
- **Esempio**: `ALERT_CHECK_INTERVAL=300000`

## Come Configurare

1. Copia il file `.env.local` esistente
2. Aggiungi le variabili sopra
3. Riavvia l'applicazione

## Esempio Completo

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
ALERT_CHECK_INTERVAL=300000

# Altre variabili esistenti...
NEXTAUTH_SECRET=your_nextauth_secret
MONGODB_URI=your_mongodb_uri
# ... etc
```

## Verifica Configurazione

Per verificare che il bot Telegram sia configurato correttamente:

1. Controlla i log all'avvio dell'applicazione
2. Dovresti vedere: `[InitApp] ✅ Sistema di alert inizializzato`
3. Se vedi: `[InitApp] ⚠️ Sistema di alert disabilitato` controlla il token

## Troubleshooting

### Bot Token Non Valido
- Verifica che il token sia completo e corretto
- Assicurati che non ci siano spazi extra
- Controlla che il bot sia stato creato correttamente

### Chat ID Non Trovato
- Scrivi al tuo bot su Telegram
- Vai su: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
- Trova il `chat.id` nella risposta JSON
