import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "https://esm.sh/@solana/web3.js@1.87.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TREASURY_WALLET = "FnAexERfb2d91Th9fgqzKi41rpAztv8aSgD4WDqSmjwX";
const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
];

async function getConnection(): Promise<Connection> {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const conn = new Connection(endpoint, "confirmed");
      await conn.getLatestBlockhash();
      return conn;
    } catch (e) {
      console.log(`RPC ${endpoint} failed, trying next...`);
    }
  }
  throw new Error("All RPC endpoints failed");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { senderWallet, expectedAmount, timeoutSeconds = 300 } = await req.json();

    if (!senderWallet || !expectedAmount) {
      throw new Error("Missing senderWallet or expectedAmount");
    }

    console.log(`Checking for stake from ${senderWallet} of ${expectedAmount} SOL`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Connect to Solana
    const connection = await getConnection();
    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    const senderPubkey = new PublicKey(senderWallet);
    
    // Get recent transactions to treasury
    const signatures = await connection.getSignaturesForAddress(treasuryPubkey, {
      limit: 20,
    });

    console.log(`Found ${signatures.length} recent transactions to treasury`);

    // Check each transaction
    for (const sigInfo of signatures) {
      // Skip failed transactions
      if (sigInfo.err) continue;
      
      // Only check transactions from the last 5 minutes
      const txTime = sigInfo.blockTime ? sigInfo.blockTime * 1000 : 0;
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (txTime < fiveMinutesAgo) continue;

      // Get full transaction details
      const tx = await connection.getParsedTransaction(sigInfo.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx?.meta || tx.meta.err) continue;

      // Check if this is a SOL transfer from the sender to treasury
      const instructions = tx.transaction.message.instructions;
      
      for (const ix of instructions) {
        if ('parsed' in ix && ix.program === 'system' && ix.parsed.type === 'transfer') {
          const { source, destination, lamports } = ix.parsed.info;
          const amountSol = lamports / LAMPORTS_PER_SOL;
          
          // Check if it matches our expected stake
          if (source === senderWallet && 
              destination === TREASURY_WALLET && 
              Math.abs(amountSol - expectedAmount) < 0.001) {
            
            console.log(`Found matching stake transaction: ${sigInfo.signature}`);
            
            // Check if this stake already exists in database
            const { data: existingStake } = await supabase
              .from("stakes")
              .select("id")
              .eq("tx_signature", sigInfo.signature)
              .single();
            
            if (existingStake) {
              console.log("Stake already recorded in database");
              return new Response(
                JSON.stringify({
                  success: true,
                  found: true,
                  alreadyRecorded: true,
                  signature: sigInfo.signature,
                  amount: amountSol,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            // Record new stake in database
            const { data: newStake, error: insertError } = await supabase
              .from("stakes")
              .insert({
                user_wallet: senderWallet,
                amount_sol: amountSol,
                tx_signature: sigInfo.signature,
              })
              .select()
              .single();
            
            if (insertError) {
              console.error("Failed to insert stake:", insertError);
              throw new Error("Failed to record stake");
            }
            
            console.log("New stake recorded successfully:", newStake.id);
            
            return new Response(
              JSON.stringify({
                success: true,
                found: true,
                alreadyRecorded: false,
                signature: sigInfo.signature,
                amount: amountSol,
                stake: newStake,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    // No matching transaction found
    return new Response(
      JSON.stringify({
        success: true,
        found: false,
        message: "No matching transaction found yet",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Detection error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Detection failed",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
