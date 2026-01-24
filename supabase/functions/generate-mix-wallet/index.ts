import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as ed from "https://esm.sh/@noble/ed25519@2.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base58 encoding (Solana uses base58)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let output = "";
  for (const byte of bytes) {
    if (byte === 0) output += BASE58_ALPHABET[0];
    else break;
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    output += BASE58_ALPHABET[digits[i]];
  }
  return output;
}

// Generate a Solana keypair using @noble/ed25519
async function generateSolanaKeypair(): Promise<{ publicKey: string; secretKey: number[] }> {
  // Generate random 32-byte private key
  const privateKey = crypto.getRandomValues(new Uint8Array(32));
  
  // Get public key from private key
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  // Solana secret key is 64 bytes: 32 bytes private + 32 bytes public
  const secretKey = new Uint8Array(64);
  secretKey.set(privateKey, 0);
  secretKey.set(publicKey, 32);
  
  return {
    publicKey: base58Encode(publicKey),
    secretKey: Array.from(secretKey),
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userWallet, amountSol } = await req.json();

    // Validate inputs
    if (!userWallet || typeof userWallet !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user wallet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = parseFloat(amountSol);
    if (isNaN(amount) || amount < 0.01 || amount > 10) {
      return new Response(
        JSON.stringify({ success: false, error: "Amount must be between 0.01 and 10 SOL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate a new Solana keypair for the deposit address
    const { publicKey: depositAddress, secretKey: depositSecretKey } = await generateSolanaKeypair();
    const depositPrivateKey = JSON.stringify(depositSecretKey);

    console.log(`[generate-mix-wallet] Creating session for ${userWallet}, amount: ${amount} SOL`);
    console.log(`[generate-mix-wallet] Generated deposit address: ${depositAddress}`);

    // Create a new mix session
    const { data: session, error: insertError } = await supabase
      .from("mix_sessions")
      .insert({
        user_wallet: userWallet,
        amount_sol: amount,
        status: "awaiting_deposit",
        deposit_address: depositAddress,
        deposit_private_key_encrypted: depositPrivateKey,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[generate-mix-wallet] Database error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create mix session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-mix-wallet] Session created: ${session.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        depositAddress: depositAddress,
        amountSol: amount,
        expiresAt: session.expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("[generate-mix-wallet] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
