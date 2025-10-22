import { NextResponse } from "next/server";
import { getRedis } from "@/libs/redis";

export async function GET() {
  try {
    const redis = getRedis();
    
    if (!redis) {
      return NextResponse.json({
        success: false,
        error: "Redis non disponibile",
        env: {
          NODE_ENV: process.env.NODE_ENV,
          UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? "✅ Configurato" : "❌ Non configurato",
          UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? "✅ Configurato" : "❌ Non configurato"
        }
      });
    }

    // Test connessione Redis
    await redis.set("test-key", "test-value", "EX", 60);
    const value = await redis.get("test-key");
    await redis.del("test-key");

    return NextResponse.json({
      success: true,
      message: "Redis funziona correttamente",
      testValue: value,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? "✅ Configurato" : "❌ Non configurato",
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? "✅ Configurato" : "❌ Non configurato"
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? "✅ Configurato" : "❌ Non configurato",
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? "✅ Configurato" : "❌ Non configurato"
      }
    }, { status: 500 });
  }
}
