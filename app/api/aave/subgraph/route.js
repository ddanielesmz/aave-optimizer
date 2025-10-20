import { NextResponse } from "next/server";
import { CacheKeyBuilder, getCacheManager } from "@/libs/redis";
import { RateLimitError, enforceRateLimit } from "@/libs/rateLimiter";

function getClientIdentifier(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return req.headers.get("cf-connecting-ip")?.trim() || "anonymous";
}

// Endpoints The Graph pubblici per Aave V3 per rete
const AAVE_V3_ENDPOINTS = {
  1: "https://api.thegraph.com/subgraphs/name/aave/aave-v3-ethereum",
  137: "https://api.thegraph.com/subgraphs/name/aave/aave-v3-polygon",
  10: "https://api.thegraph.com/subgraphs/name/aave/aave-v3-optimism",
  42161: "https://api.thegraph.com/subgraphs/name/aave/aave-v3-arbitrum",
  43114: "https://api.thegraph.com/subgraphs/name/aave/aave-v3-avalanche",
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { chainId, query, variables } = body || {};

    try {
      await enforceRateLimit({
        identifier: getClientIdentifier(req),
        action: "aave-subgraph",
        limit: 10,
        windowSeconds: 60,
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down." },
          { status: 429, headers: { "Retry-After": String(error.retryAfter) } },
        );
      }
      throw error;
    }

    if (!chainId || !query) {
      return NextResponse.json(
        { error: "Missing chainId or query" },
        { status: 400 }
      );
    }

    if (typeof query !== "string" || query.length > 5000) {
      return NextResponse.json(
        { error: "Query is invalid or too large" },
        { status: 400 },
      );
    }

    if (variables && typeof variables !== "object") {
      return NextResponse.json(
        { error: "Variables must be an object" },
        { status: 400 },
      );
    }

    const endpoint = AAVE_V3_ENDPOINTS[chainId];
    if (!endpoint) {
      return NextResponse.json(
        { error: `Unsupported chainId ${chainId}` },
        { status: 400 }
      );
    }

    const cache = getCacheManager();
    
    // Genera chiave cache basata su query e variabili
    const queryHash = Buffer.from(query + JSON.stringify(variables || {})).toString('base64').slice(0, 16);
    const cacheKey = CacheKeyBuilder.marketAaveData(chainId, `subgraph:${queryHash}`);
    
    // Controlla cache prima di fare richiesta al subgraph
    let cachedData = await cache.get(cacheKey);

    if (cachedData) {
      console.log(`[API Subgraph] ✅ Dati trovati in cache per chain ${chainId}`);

      return NextResponse.json({
        ...cachedData,
        _metadata: {
          fromCache: true,
          timestamp: new Date().toISOString(),
          cacheKey
        }
      });
    }

    console.log(`[API Subgraph] ❌ Cache miss per chain ${chainId}, fetching subgraph...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Subgraph error: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    if (data.errors) {
      return NextResponse.json(
        { error: data.errors },
        { status: 502 }
      );
    }

    // Salva in cache con TTL di 10 minuti
    await cache.set(cacheKey, data.data, 600);
    console.log(`[API Subgraph] 💾 Dati salvati in cache per chain ${chainId}`);

    return NextResponse.json({
      ...data.data,
      _metadata: {
        fromCache: false,
        timestamp: new Date().toISOString(),
        cacheKey,
        savedToCache: true
      }
    });
  } catch (err) {
    console.error("/api/aave/subgraph error", err);
    const message = err?.name === "AbortError" ? "Subgraph request timed out" : (err?.message || "Unknown error");
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


