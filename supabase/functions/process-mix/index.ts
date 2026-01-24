import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use Helius RPC for reliable mainnet access
function getRpcUrl(): string {
  const heliusKey = Deno.env.get("HELIUS_API_KEY");
  if (heliusKey) {
    return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  }
  // Fallback to public RPC
  return "https://api.mainnet-beta.solana.com";
}

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

// Generate keypair using Web Crypto Ed25519
async function generateSolanaKeypair(): Promise<{ publicKey: string; secretKey: number[] }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "Ed25519" },
    true,
    ["sign", "verify"]
  ) as CryptoKeyPair;

  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const privateKeyBytes = new Uint8Array(privateKeyBuffer);
  const seed = privateKeyBytes.slice(-32);

  const publicKeyBuffer = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKeyBytes = new Uint8Array(publicKeyBuffer);

  const secretKey = new Uint8Array(64);
  secretKey.set(seed, 0);
  secretKey.set(publicKeyBytes, 32);

  return { publicKey: base58Encode(publicKeyBytes), secretKey: Array.from(secretKey) };
}

// Import private key for signing
async function importPrivateKey(secretKey: Uint8Array): Promise<CryptoKey> {
  const seed = secretKey.slice(0, 32);
  
  // Build PKCS8 format for Ed25519
  // RFC 8410 PKCS#8 format: 302e020100300506032b657004220420 + 32 bytes seed
  const pkcs8Header = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06,
    0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20
  ]);
  const pkcs8 = new Uint8Array(pkcs8Header.length + 32);
  pkcs8.set(pkcs8Header, 0);
  pkcs8.set(seed, pkcs8Header.length);

  return await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "Ed25519" },
    false,
    ["sign"]
  );
}

// Build and sign a Solana transfer transaction
async function buildAndSignTransfer(
  fromSecretKey: Uint8Array,
  toPublicKey: Uint8Array,
  lamports: number,
  recentBlockhash: string
): Promise<string> {
  const fromPublicKey = fromSecretKey.slice(32, 64);

  // System program ID (all zeros effectively, but base58 encoded as 32 1's)
  const systemProgramId = new Uint8Array(32); // All zeros for system program

  // Instruction data: 2 (transfer) as u32 LE + lamports as u64 LE
  const instructionData = new Uint8Array(12);
  const dataView = new DataView(instructionData.buffer);
  dataView.setUint32(0, 2, true); // Transfer instruction
  dataView.setBigUint64(4, BigInt(lamports), true);

  // Build the message
  const header = new Uint8Array([
    1, // numRequiredSignatures
    0, // numReadonlySignedAccounts
    1  // numReadonlyUnsignedAccounts (system program)
  ]);

  // Account keys: from, to, system program
  const accountKeys = new Uint8Array(32 * 3);
  accountKeys.set(fromPublicKey, 0);
  accountKeys.set(toPublicKey, 32);
  accountKeys.set(systemProgramId, 64);

  // Blockhash (32 bytes)
  const blockhashBytes = base58Decode(recentBlockhash);

  // Compact-u16 for number of accounts (3)
  const numAccountsCompact = new Uint8Array([3]);

  // Instructions section
  // Compact-u16 for number of instructions (1)
  const numInstructionsCompact = new Uint8Array([1]);
  
  // Instruction:
  // - program_id_index: 1 byte (2 = system program)
  // - account indices: compact-u16 length + indices
  // - data: compact-u16 length + data
  const instruction = new Uint8Array([
    2,  // program id index (system program at index 2)
    2,  // compact-u16: 2 account indices
    0,  // from account index
    1,  // to account index
    12, // compact-u16: 12 bytes of data
    ...instructionData
  ]);

  // Assemble message
  const messageLength = header.length + 1 + accountKeys.length + blockhashBytes.length + 1 + instruction.length;
  const message = new Uint8Array(messageLength);
  let offset = 0;
  
  message.set(header, offset);
  offset += header.length;
  
  message.set(numAccountsCompact, offset);
  offset += numAccountsCompact.length;
  
  message.set(accountKeys, offset);
  offset += accountKeys.length;
  
  message.set(blockhashBytes, offset);
  offset += blockhashBytes.length;
  
  message.set(numInstructionsCompact, offset);
  offset += numInstructionsCompact.length;
  
  message.set(instruction, offset);

  // Sign the message
  const privateKey = await importPrivateKey(fromSecretKey);
  const signatureBuffer = await crypto.subtle.sign("Ed25519", privateKey, message);
  const signature = new Uint8Array(signatureBuffer);

  // Build the full transaction
  // Format: num_signatures (compact-u16) + signatures + message
  const transaction = new Uint8Array(1 + 64 + message.length);
  transaction[0] = 1; // 1 signature
  transaction.set(signature, 1);
  transaction.set(message, 65);

  console.log(`[process-mix] Transaction built, length: ${transaction.length} bytes`);

  // Return as base64
  return btoa(String.fromCharCode(...transaction));
}

Deno.serve(async (req: Request) => {
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
    const balanceResponse = await fetch(getRpcUrl(), {
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

    const fee = 5000; // 0.000005 SOL for transaction fee
    const transferAmount = balance - fee;

    if (transferAmount <= 0) {
      await supabase.from("mix_sessions").update({ status: "failed" }).eq("id", sessionId);
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient balance for transfer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recent blockhash with finalized commitment for more stability
    console.log(`[process-mix] Getting recent blockhash...`);
    const blockhashResponse = await fetch(getRpcUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getLatestBlockhash",
        params: [{ commitment: "finalized" }],
      }),
    });
    const blockhashData = await blockhashResponse.json();
    
    if (blockhashData.error) {
      console.error("[process-mix] Blockhash error:", blockhashData.error);
      throw new Error(`Failed to get blockhash: ${JSON.stringify(blockhashData.error)}`);
    }
    
    const recentBlockhash = blockhashData.result?.value?.blockhash;
    const lastValidBlockHeight = blockhashData.result?.value?.lastValidBlockHeight;

    if (!recentBlockhash) {
      throw new Error("Failed to get recent blockhash - no blockhash in response");
    }

    console.log(`[process-mix] Blockhash: ${recentBlockhash}, valid until block: ${lastValidBlockHeight}`);

    // Build and sign transaction
    const signedTxBase64 = await buildAndSignTransfer(
      depositSecretKey,
      outputPublicKey,
      transferAmount,
      recentBlockhash
    );

    console.log(`[process-mix] Sending transaction...`);

    // Send transaction with skipPreflight to avoid simulation issues
    const sendResponse = await fetch(getRpcUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sendTransaction",
        params: [
          signedTxBase64, 
          { 
            encoding: "base64", 
            skipPreflight: true,
            preflightCommitment: "confirmed",
            maxRetries: 3
          }
        ],
      }),
    });
    const sendData = await sendResponse.json();

    if (sendData.error) {
      console.error("[process-mix] Transaction error:", sendData.error);
      await supabase.from("mix_sessions").update({ status: "failed" }).eq("id", sessionId);
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
