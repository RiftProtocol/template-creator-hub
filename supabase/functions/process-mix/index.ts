import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as ed from "https://esm.sh/@noble/ed25519@2.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RPC_URL = "https://api.mainnet-beta.solana.com";
const LAMPORTS_PER_SOL = 1_000_000_000;

// Base58 helpers
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

function base58Decode(str: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of str) {
    const index = BASE58_ALPHABET.indexOf(char);
    if (index === -1) throw new Error("Invalid base58 character");
    let carry = index;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of str) {
    if (char === "1") bytes.push(0);
    else break;
  }
  return new Uint8Array(bytes.reverse());
}

// Generate keypair using @noble/ed25519
async function generateSolanaKeypair(): Promise<{ publicKey: string; secretKey: number[] }> {
  const privateKey = crypto.getRandomValues(new Uint8Array(32));
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  const secretKey = new Uint8Array(64);
  secretKey.set(privateKey, 0);
  secretKey.set(publicKey, 32);
  return { publicKey: base58Encode(publicKey), secretKey: Array.from(secretKey) };
}

// Build and sign a Solana transfer transaction manually
async function buildAndSignTransfer(
  fromSecretKey: Uint8Array,
  toPublicKey: Uint8Array,
  lamports: number,
  recentBlockhash: string
): Promise<string> {
  const fromPrivateKey = fromSecretKey.slice(0, 32);
  const fromPublicKey = fromSecretKey.slice(32, 64);

  // System program ID
  const systemProgramId = base58Decode("11111111111111111111111111111111");

  // Instruction data: 2 (transfer) + 8 bytes lamports (little-endian)
  const instructionData = new Uint8Array(12);
  const dataView = new DataView(instructionData.buffer);
  dataView.setUint32(0, 2, true); // Transfer instruction index
  dataView.setBigUint64(4, BigInt(lamports), true);

  // Build compact message
  const numRequiredSignatures = 1;
  const numReadonlySignedAccounts = 0;
  const numReadonlyUnsignedAccounts = 1; // System program

  // Message components
  const header = new Uint8Array([numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts]);
  
  // Accounts: from, to, system program
  const numAccounts = 3;
  const accounts = new Uint8Array(1 + 32 * numAccounts);
  accounts[0] = numAccounts;
  accounts.set(fromPublicKey, 1);
  accounts.set(toPublicKey, 33);
  accounts.set(systemProgramId, 65);

  // Blockhash
  const blockhashBytes = base58Decode(recentBlockhash);

  // Instructions
  const instruction = new Uint8Array([
    1, // Number of instructions
    2, // Program ID index (system program)
    2, // Number of account indices
    0, // From account index
    1, // To account index
    12, // Data length
    ...instructionData,
  ]);

  // Combine message
  const message = new Uint8Array(header.length + accounts.length + blockhashBytes.length + instruction.length);
  let offset = 0;
  message.set(header, offset); offset += header.length;
  message.set(accounts, offset); offset += accounts.length;
  message.set(blockhashBytes, offset); offset += blockhashBytes.length;
  message.set(instruction, offset);

  // Sign message
  const signature = await ed.signAsync(message, fromPrivateKey);

  // Build transaction
  const transaction = new Uint8Array(1 + 64 + message.length);
  transaction[0] = 1; // Number of signatures
  transaction.set(signature, 1);
  transaction.set(message, 65);

  // Return as base64
  const base64 = btoa(String.fromCharCode(...transaction));
  return base64;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: "Session ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from("mix_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ success: false, error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already completed
    if (session.status === "completed") {
      return new Response(
        JSON.stringify({
          success: true,
          status: "completed",
          outputAddress: session.output_address,
          outputPrivateKey: session.output_private_key,
          txSignatureOut: session.tx_signature_out,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.status !== "deposit_detected") {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid status: ${session.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-mix] Processing session ${sessionId}`);

    await supabase.from("mix_sessions").update({ status: "processing" }).eq("id", sessionId);

    // Get deposit keypair
    const depositSecretKey = new Uint8Array(JSON.parse(session.deposit_private_key_encrypted));
    const depositPublicKey = depositSecretKey.slice(32, 64);
    const depositAddress = base58Encode(depositPublicKey);

    // Generate output wallet
    const { publicKey: outputAddress, secretKey: outputSecretKeyArr } = await generateSolanaKeypair();
    const outputPublicKey = base58Decode(outputAddress);
    const outputPrivateKey = JSON.stringify(outputSecretKeyArr);

    console.log(`[process-mix] Output wallet: ${outputAddress}`);

    // Get balance
    const balanceResponse = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [depositAddress, { commitment: "confirmed" }],
      }),
    });
    const balanceData = await balanceResponse.json();
    const balance = balanceData.result?.value || 0;

    console.log(`[process-mix] Deposit balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    const fee = 5000;
    const transferAmount = balance - fee;

    if (transferAmount <= 0) {
      await supabase.from("mix_sessions").update({ status: "failed" }).eq("id", sessionId);
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recent blockhash
    const blockhashResponse = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getLatestBlockhash",
        params: [{ commitment: "confirmed" }],
      }),
    });
    const blockhashData = await blockhashResponse.json();
    const recentBlockhash = blockhashData.result?.value?.blockhash;

    if (!recentBlockhash) {
      throw new Error("Failed to get recent blockhash");
    }

    // Build and sign transaction
    const signedTxBase64 = await buildAndSignTransfer(
      depositSecretKey,
      outputPublicKey,
      transferAmount,
      recentBlockhash
    );

    // Send transaction
    const sendResponse = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sendTransaction",
        params: [signedTxBase64, { encoding: "base64", skipPreflight: false }],
      }),
    });
    const sendData = await sendResponse.json();

    if (sendData.error) {
      console.error("[process-mix] Transaction error:", sendData.error);
      throw new Error(`Transaction failed: ${JSON.stringify(sendData.error)}`);
    }

    const signature = sendData.result;
    console.log(`[process-mix] Transfer complete: ${signature}`);

    await supabase
      .from("mix_sessions")
      .update({
        status: "completed",
        output_address: outputAddress,
        output_private_key: outputPrivateKey,
        tx_signature_out: signature,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        status: "completed",
        outputAddress,
        outputPrivateKey,
        txSignatureOut: signature,
        amountTransferred: transferAmount / LAMPORTS_PER_SOL,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("[process-mix] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
