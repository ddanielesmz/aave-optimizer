import { NextResponse } from "next/server";
import { fetchAaveUserAccountData } from "@/libs/aaveOnchain";
import { CacheKeyBuilder, getCacheManager } from "@/libs/redis";
import { getQueueManager, QUEUE_NAMES } from "@/libs/queueManager";

/**
 * API Route per fetchare i dati dell'account Aave on-chain
 * GET /api/aave/onchain?address=0x...
 */
export async function GET(req) {
  try {
    // Estrazione dell'indirizzo e chainId dai query parameters
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const chainId = searchParams.get('chainId');

    // Validazione dell'indirizzo
    if (!address) {
      return NextResponse.json(
        { 
          error: "Parametro 'address' mancante",
          message: "Fornisci un indirizzo Ethereum valido nel query parameter 'address'"
        },
        { status: 400 }
      );
    }

    // Validazione formato indirizzo
    if (!address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json(
        { 
          error: "Indirizzo non valido",
          message: "L'indirizzo deve essere un indirizzo Ethereum valido (0x...)"
        },
        { status: 400 }
      );
    }

    // Validazione chainId se fornito
    const parsedChainId = chainId ? parseInt(chainId) : null;
    if (chainId && (isNaN(parsedChainId) || parsedChainId <= 0)) {
      return NextResponse.json(
        { 
          error: "Chain ID non valido",
          message: "Il chainId deve essere un numero positivo valido"
        },
        { status: 400 }
      );
    }

    console.log(`[API Aave] Fetching data for address: ${address} on chain: ${parsedChainId || 'default'}`);

    const cache = getCacheManager();
    const queueManager = getQueueManager();
    
    // Genera chiave cache
    const cacheKey = CacheKeyBuilder.userAaveData(address, parsedChainId || 42161, 'account');
    
    // Controlla cache prima di fare richiesta on-chain
    let userData = await cache.get(cacheKey);
    let fromCache = false;
    
    if (userData) {
      console.log(`[API Aave] ✅ Dati trovati in cache per ${address}`);
      fromCache = true;
    } else {
      console.log(`[API Aave] ❌ Cache miss per ${address}, fetching on-chain...`);
      
      // Fetch dei dati on-chain
      try {
        userData = await fetchAaveUserAccountData(address, parsedChainId);
        console.log(`[API Aave] Successfully fetched data:`, userData ? 'Data received' : 'No data');
        
        // Salva in cache con TTL di 5 minuti se i dati sono validi
        if (userData) {
          await cache.set(cacheKey, userData, 300);
          console.log(`[API Aave] 💾 Dati salvati in cache per ${address}`);
        }
      } catch (error) {
        console.error(`[API Aave] Error in fetchAaveUserAccountData:`, error);
        throw error;
      }
    }
    
    // Se i dati sono stati recuperati (da cache o on-chain), avvia job per aggiornamento health
    if (userData && !fromCache) {
      try {
        const healthJobManager = queueManager.getJobManager(QUEUE_NAMES.AAVE_HEALTH_UPDATE);
        await healthJobManager.addJob('update-user-health', {
          userAddress: address,
          chainId: parsedChainId || 42161,
          forceUpdate: false
        }, {
          delay: 1000, // Ritarda di 1 secondo per evitare sovraccarico
          priority: 1
        });
        console.log(`[API Aave] 📝 Job health aggiornamento aggiunto per ${address}`);
      } catch (error) {
        console.error(`[API Aave] ⚠️ Errore aggiunta job health per ${address}:`, error);
        // Non bloccare la risposta per errori di job
      }
    }

    // Controllo se i dati sono stati recuperati con successo
    if (!userData) {
      return NextResponse.json(
        { 
          error: "Errore nel recupero dei dati",
          message: "Unable to fetch Aave data. Please check: 1) Wallet is connected to Arbitrum, 2) Environment variables are configured, 3) Address has active Aave positions.",
          details: "Check the server logs for more specific error information."
        },
        { status: 500 }
      );
    }

    // Ritorna i dati normalizzati con metadati
    return NextResponse.json(
      {
        success: true,
        data: userData,
        metadata: {
          timestamp: new Date().toISOString(),
          dataSource: fromCache ? 'Redis Cache' : 'Aave V3 On-Chain',
          fromCache,
          guaranteedFields: [
            'address',
            'totalCollateral',
            'totalDebt', 
            'availableBorrows',
            'currentLiquidationThreshold',
            'ltv',
            'healthFactor'
          ],
          note: 'Health Factor è l\'unico campo garantito per tutti gli utenti. Altri campi dipendono dalla versione Aave e dalla configurazione del pool.',
          reserves: userData.reserves || null,
          positions: userData.positions || null,
          cacheInfo: fromCache ? {
            cached: true,
            cacheKey,
            ttl: await cache.getTTL(cacheKey)
          } : {
            cached: false,
            cacheKey,
            savedToCache: true
          }
        }
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('[API Aave] Errore nella route:', error);

    return NextResponse.json(
      { 
        error: "Errore interno del server",
        message: "Si è verificato un errore durante il recupero dei dati Aave",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
