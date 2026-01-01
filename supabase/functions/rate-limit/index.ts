import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateLimitRequest {
  action: string;
  identifier?: string; // Optional client identifier (IP or user ID)
}

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

// Rate limit configurations per action
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowSeconds: 60 },
  transaction: { maxRequests: 10, windowSeconds: 60 },
  create: { maxRequests: 20, windowSeconds: 60 },
  email: { maxRequests: 3, windowSeconds: 300 },
  default: { maxRequests: 100, windowSeconds: 60 },
};

// In-memory rate limit store (for serverless, consider using Redis or Supabase)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically
const cleanupStore = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, identifier }: RateLimitRequest = await req.json();
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: "Action is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get client IP from headers or use identifier
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     identifier ||
                     "unknown";
    
    const key = `${action}:${clientIp}`;
    const config = rateLimitConfigs[action] || rateLimitConfigs.default;
    const now = Date.now();
    
    // Cleanup old entries
    cleanupStore();
    
    // Check rate limit
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // New window
      rateLimitStore.set(key, { 
        count: 1, 
        resetTime: now + (config.windowSeconds * 1000) 
      });
      
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          remaining: config.maxRequests - 1,
          resetIn: config.windowSeconds
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (record.count >= config.maxRequests) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      
      console.log(`Rate limit exceeded for ${key}`);
      
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          remaining: 0,
          resetIn,
          error: `Rate limit exceeded. Try again in ${resetIn} seconds.`
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Increment count
    record.count++;
    
    return new Response(
      JSON.stringify({ 
        allowed: true, 
        remaining: config.maxRequests - record.count,
        resetIn: Math.ceil((record.resetTime - now) / 1000)
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error) {
    console.error("Rate limit error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
