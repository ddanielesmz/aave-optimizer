#!/usr/bin/env node

/**
 * Script di test per il sistema di alert
 * Verifica la configurazione e testa le funzionalità base
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import telegramNotifier from './libs/telegram.js';
import Alert from './models/Alert.js';
import config from './config.js';

// Carica variabili d'ambiente
dotenv.config({ path: '.env.local' });

async function testTelegramConnection() {
  console.log('🔍 Test connessione Telegram...');
  
  const result = await telegramNotifier.testConnection();
  
  if (result.success) {
    console.log('✅ Bot Telegram configurato correttamente');
    console.log(`   Bot: ${result.botInfo.first_name} (@${result.botInfo.username})`);
  } else {
    console.log('❌ Errore configurazione Telegram:', result.error);
    console.log('   Verifica TELEGRAM_BOT_TOKEN nel file .env.local');
  }
  
  return result.success;
}

async function testDatabaseConnection() {
  console.log('🔍 Test connessione database...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connessione database OK');
    
    // Test creazione modello Alert
    const testAlert = new Alert({
      userId: new mongoose.Types.ObjectId(),
      widgetType: 'healthFactor',
      alertName: 'Test Alert',
      condition: 'less_than',
      threshold: 1.5,
      telegramChatId: '123456789',
      isActive: false, // Non attivare il test
    });
    
    await testAlert.save();
    console.log('✅ Modello Alert funzionante');
    
    // Pulisci il test
    await Alert.findByIdAndDelete(testAlert._id);
    console.log('✅ Test alert rimosso');
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Errore database:', error.message);
    return false;
  }
}

async function testAlertSystem() {
  console.log('🔍 Test sistema di alert...');
  
  try {
    // Test configurazione
    if (!config.telegram.enabled) {
      console.log('⚠️ Sistema alert disabilitato (TELEGRAM_BOT_TOKEN mancante)');
      return false;
    }
    
    console.log('✅ Configurazione alert OK');
    console.log(`   Intervallo controllo: ${config.telegram.checkInterval}ms`);
    
    return true;
  } catch (error) {
    console.log('❌ Errore sistema alert:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Test Sistema Alert DeFi Dashboard\n');
  
  const results = {
    telegram: await testTelegramConnection(),
    database: await testDatabaseConnection(),
    alertSystem: await testAlertSystem(),
  };
  
  console.log('\n📊 Risultati Test:');
  console.log(`   Telegram: ${results.telegram ? '✅' : '❌'}`);
  console.log(`   Database: ${results.database ? '✅' : '❌'}`);
  console.log(`   Alert System: ${results.alertSystem ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 Tutti i test sono passati! Il sistema di alert è pronto.');
    console.log('\n📝 Prossimi passi:');
    console.log('   1. Configura il tuo Chat ID Telegram');
    console.log('   2. Avvia l\'applicazione');
    console.log('   3. Vai alla dashboard e configura i tuoi alert');
  } else {
    console.log('\n⚠️ Alcuni test sono falliti. Controlla la configurazione.');
    console.log('\n📖 Documentazione:');
    console.log('   - ALERT_SYSTEM_README.md');
    console.log('   - ALERT_ENV_CONFIG.md');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Gestisci errori non catturati
process.on('unhandledRejection', (error) => {
  console.error('❌ Errore non gestito:', error);
  process.exit(1);
});

// Esegui test
main().catch(console.error);
