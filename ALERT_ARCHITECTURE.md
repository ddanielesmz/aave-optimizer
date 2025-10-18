# 🏗️ Architettura Sistema Alert

## Diagramma del Sistema

```mermaid
graph TB
    subgraph "Frontend Dashboard"
        A[Widget Dashboard] --> B[AlertSettings Component]
        B --> C[API Client]
    end
    
    subgraph "Backend API"
        C --> D[/api/alerts - CRUD]
        C --> E[/api/alerts/:id/test - Test]
        D --> F[Alert Model]
        E --> F
    end
    
    subgraph "Database"
        F --> G[(MongoDB)]
    end
    
    subgraph "Monitoring System"
        H[AlertMonitor] --> I[Check Every 5min]
        I --> J[Get Current Values]
        J --> K[Check Conditions]
        K --> L[Trigger Alert?]
        L --> M[Send Telegram]
    end
    
    subgraph "Telegram Integration"
        M --> N[Telegram Bot]
        N --> O[User Chat]
    end
    
    subgraph "Data Sources"
        P[Aave Health Factor] --> J
        Q[LTV Ratio] --> J
        R[Net APY] --> J
    end
    
    G --> H
    F --> H
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style D fill:#e8f5e8
    style H fill:#fff3e0
    style N fill:#e3f2fd
```

## Flusso di Funzionamento

### 1. Configurazione Alert
1. Utente clicca 🔔 su un widget
2. Compila form con soglia e Chat ID Telegram
3. Alert salvato in MongoDB

### 2. Monitoraggio Automatico
1. AlertMonitor controlla ogni 5 minuti
2. Recupera valori attuali dai widget
3. Verifica condizioni di ogni alert attivo
4. Se condizione soddisfatta → invia notifica Telegram

### 3. Notifica Telegram
1. Formatta messaggio con dati alert
2. Invia via Bot Telegram
3. Aggiorna timestamp ultimo trigger
4. Applica cooldown per evitare spam

## Componenti Principali

### Frontend
- **AlertSettings**: Interfaccia configurazione alert
- **WidgetWithAlerts**: Wrapper per integrare alert nei widget
- **API Client**: Comunicazione con backend

### Backend
- **Alert Model**: Schema MongoDB per alert
- **API Routes**: CRUD operations + test
- **AlertMonitor**: Sistema monitoraggio automatico
- **TelegramNotifier**: Invio notifiche Telegram

### Database
- **Alert Collection**: Configurazioni alert utenti
- **Indexes**: Performance ottimizzate per query

## Sicurezza

- ✅ Autenticazione obbligatoria per tutte le operazioni
- ✅ Validazione completa input utente
- ✅ Alert isolati per utente (non cross-user access)
- ✅ Rate limiting su API
- ✅ Sanitizzazione messaggi Telegram

## Performance

- ✅ Monitoraggio asincrono (non blocca UI)
- ✅ Cooldown configurabile per evitare spam
- ✅ Index MongoDB per query veloci
- ✅ Controlli batch per efficienza
- ✅ Error handling robusto

## Scalabilità

- ✅ Sistema modulare e estendibile
- ✅ Supporto per nuovi tipi di widget
- ✅ Configurazione flessibile intervalli
- ✅ Architettura stateless per scaling orizzontale
