import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "https://esm.sh/@solana/web3.js@1.87.6";
import * as bs58 from "https://esm.sh/bs58@5.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, claimId, requestId, recipientWallet, amount } = await req.json();

    // Validate input
    if (!recipientWallet || !amount || amount <= 0) {
      throw new Error("Invalid request: missing recipient or amount");
    }

    // Get treasury private key from secrets
    const treasuryPrivateKey = Deno.env.get("TREASURY_PRIVATE_KEY");
    if (!treasuryPrivateKey) {
      throw new Error("Treasury key not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Connect to Solana mainnet
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

    // Decode treasury keypair
    let treasuryKeypair: Keypair;
    try {
      // Try base58 format first
      const decoded = bs58.decode(treasuryPrivateKey);
      treasuryKeypair = Keypair.fromSecretKey(decoded);
    } catch {
      // Try JSON array format
      try {
        const secretKey = JSON.parse(treasuryPrivateKey);
        treasuryKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
      } catch {
        throw new Error("Invalid treasury key format");
      }
    }

    // Check treasury balance
    const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);
    const lamportsToSend = Math.floor(amount * LAMPORTS_PER_SOL);
    const estimatedFee = 5000; // ~0.000005 SOL

    if (treasuryBalance < lamportsToSend + estimatedFee) {
      throw new Error("Insufficient treasury balance");
    }

    // Create and send transaction
    const recipientPubkey = new PublicKey(recipientWallet);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: lamportsToSend,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [treasuryKeypair]);

    // Update database based on type
    if (type === "reward" && claimId) {
      // Update claim status
      await supabase
        .from("reward_claims")
        .update({
          status: "completed",
          tx_signature: signature,
        })
        .eq("id", claimId);

      // Get the stake_id from the claim and update claimed_rewards_sol
      const { data: claim } = await supabase
        .from("reward_claims")
        .select("stake_id, amount_sol")
        .eq("id", claimId)
        .single();

      if (claim?.stake_id) {
        // Get current claimed amount
        const { data: stake } = await supabase
          .from("stakes")
          .select("claimed_rewards_sol")
          .eq("id", claim.stake_id)
          .single();

        const currentClaimed = stake?.claimed_rewards_sol || 0;
        
        // Update the stake with new claimed total
        await supabase
          .from("stakes")
          .update({
            claimed_rewards_sol: currentClaimed + claim.amount_sol,
            last_claimed_at: new Date().toISOString(),
          })
          .eq("id", claim.stake_id);
      }
    } else if (type === "unstake" && requestId) {
      await supabase
        .from("unstake_requests")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
          tx_signature: signature,
        })
        .eq("id", requestId);

      // Get stake_id and mark stake as completed
      const { data: unstakeRequest } = await supabase
        .from("unstake_requests")
        .select("stake_id")
        .eq("id", requestId)
        .single();

      if (unstakeRequest?.stake_id) {
        await supabase
          .from("stakes")
          .update({ status: "completed" })
          .eq("id", unstakeRequest.stake_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        signature,
        amount,
        recipient: recipientWallet,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Payout error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Payout failed",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
