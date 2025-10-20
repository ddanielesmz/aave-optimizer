#!/usr/bin/env node

/**
 * Script per testare l'integrazione degli alert nei widget
 * Verifica che i componenti siano correttamente importati e configurati
 */

import fs from 'fs';
import path from 'path';

const WIDGETS_TO_CHECK = [
  'components/dashboard/AaveHealthWidget.js',
  'components/dashboard/CurrentLTVWidget.js', 
  'components/dashboard/NetAPYCard.js'
];

const REQUIRED_IMPORTS = [
  'AlertSettings',
  'widgetType',
  'currentValue',
  'widgetName'
];

function checkWidgetIntegration(widgetPath) {
  console.log(`🔍 Controllo ${widgetPath}...`);
  
  if (!fs.existsSync(widgetPath)) {
    console.log(`❌ File non trovato: ${widgetPath}`);
    return false;
  }
  
  const content = fs.readFileSync(widgetPath, 'utf8');
  
  // Controlla import AlertSettings
  if (!content.includes('import AlertSettings')) {
    console.log(`❌ Import AlertSettings mancante in ${widgetPath}`);
    return false;
  }
  
  // Controlla presenza componente AlertSettings
  if (!content.includes('<AlertSettings')) {
    console.log(`❌ Componente AlertSettings mancante in ${widgetPath}`);
    return false;
  }
  
  // Controlla widgetType specifico
  let widgetType = '';
  if (widgetPath.includes('AaveHealthWidget')) {
    widgetType = 'healthFactor';
  } else if (widgetPath.includes('CurrentLTVWidget')) {
    widgetType = 'ltv';
  } else if (widgetPath.includes('NetAPYCard')) {
    widgetType = 'netAPY';
  }
  
  if (widgetType && !content.includes(`widgetType="${widgetType}"`)) {
    console.log(`❌ widgetType="${widgetType}" mancante in ${widgetPath}`);
    return false;
  }
  
  console.log(`✅ ${widgetPath} configurato correttamente`);
  return true;
}

function main() {
  console.log('🚀 Test Integrazione Alert nei Widget\n');
  
  let allPassed = true;
  
  WIDGETS_TO_CHECK.forEach(widgetPath => {
    const passed = checkWidgetIntegration(widgetPath);
    if (!passed) {
      allPassed = false;
    }
  });
  
  console.log('\n📊 Risultati:');
  if (allPassed) {
    console.log('🎉 Tutti i widget sono stati integrati correttamente!');
    console.log('\n📱 Come testare:');
    console.log('1. Avvia l\'applicazione: npm run dev');
    console.log('2. Vai alla dashboard');
    console.log('3. Cerca l\'icona 🔔 nei widget');
    console.log('4. Clicca per configurare alert');
  } else {
    console.log('⚠️ Alcuni widget hanno problemi di integrazione');
  }
  
  process.exit(allPassed ? 0 : 1);
}

main();
