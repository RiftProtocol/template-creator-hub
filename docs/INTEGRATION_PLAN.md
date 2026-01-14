# RIFT Mixer Integration Plan

## Complete Roadmap: From Contract to Working Product

---

## Phase 1: Smart Contract Deployment (You Do This)

### Step 1.1: Deploy the Contract

**Option A: Solana Playground (Easiest)**
1. Go to [https://beta.solpg.io](https://beta.solpg.io)
2. Create new Anchor project
3. Paste code from `contracts/rift-mixer/programs/rift-mixer/src/lib.rs`
4. Click **Build** → **Deploy**
5. Save the **Program ID**

**Option B: Local Anchor CLI**
```bash
cd contracts/rift-mixer
anchor build
anchor deploy --provider.cluster devnet
```

### Step 1.2: Initialize Pools
After deployment, initialize each pool type:
```bash
# Using Anchor CLI or custom script
anchor run initialize-pools
```

### Step 1.3: Provide to Lovable
Once deployed, give me:
- ✅ Program ID (e.g., `RiFT7xK9...`)
- ✅ IDL JSON file (generated during build)

---

## Phase 2: Frontend Integration (I Do This)

### Step 2.1: Program Configuration
```typescript
// src/lib/rift/config.ts
export const RIFT_PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID");
export const RIFT_IDL = { /* IDL from Anchor build */ };
```

### Step 2.2: Update Umbra Client
Replace simulated functions with real program calls:

```typescript
// Deposit - Real implementation
async createDepositTransaction(depositor: PublicKey, note: DepositNote): Promise<Transaction> {
  const program = new Program(RIFT_IDL, RIFT_PROGRAM_ID, provider);
  
  return program.methods
    .deposit(note.commitment)
    .accounts({
      pool: poolPda,
      merkleTree: merklePda,
      poolVault: vaultPda,
      depositor: depositor,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
}

// Withdraw - Real implementation
async createWithdrawTransaction(
  note: DepositNote,
  recipient: PublicKey,
  proof: ZkProof
): Promise<Transaction> {
  const program = new Program(RIFT_IDL, RIFT_PROGRAM_ID, provider);
  
  return program.methods
    .withdraw(proof, nullifierHash, recipient, relayer, fee)
    .accounts({
      pool: poolPda,
      nullifierRegistry: nullifierPda,
      poolVault: vaultPda,
      recipient: recipient,
      relayer: relayerPubkey,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
}
```

### Step 2.3: Pool Stats from On-Chain
```typescript
async getPoolStats(poolType: PoolType): Promise<PoolStats> {
  const program = new Program(RIFT_IDL, RIFT_PROGRAM_ID, provider);
  const poolPda = derivePoolPda(poolType);
  
  const pool = await program.account.pool.fetch(poolPda);
  return {
    totalDeposits: pool.totalDeposits.toNumber(),
    totalWithdrawals: pool.totalWithdrawals.toNumber(),
    anonymitySet: pool.totalDeposits.toNumber() - pool.totalWithdrawals.toNumber(),
    merkleRoot: pool.merkleRoot,
  };
}
```

---

## Phase 3: ZK Proof System (Advanced)

### Step 3.1: Circuit Design
You'll need a Circom circuit that proves:
1. Knowledge of `secret` and `nullifier` such that `hash(secret, nullifier) = commitment`
2. The commitment exists in the Merkle tree
3. The nullifier hash is correctly computed

```circom
// circuits/withdraw.circom
template Withdraw(levels) {
    signal input root;
    signal input nullifierHash;
    signal input recipient;
    signal input secret;
    signal input nullifier;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    
    // Verify commitment
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== nullifier;
    commitmentHasher.inputs[1] <== secret;
    
    // Verify Merkle proof
    component tree = MerkleTreeChecker(levels);
    tree.leaf <== commitmentHasher.out;
    tree.root <== root;
    // ... path verification
    
    // Verify nullifier hash
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash === nullifierHasher.out;
}
```

### Step 3.2: Proof Generation (Client-Side)
```typescript
// Generate proof in browser using snarkjs
import { groth16 } from "snarkjs";

async function generateProof(input: ProofInput): Promise<ZkProof> {
  const { proof, publicSignals } = await groth16.fullProve(
    input,
    "circuits/withdraw.wasm",
    "circuits/withdraw_final.zkey"
  );
  
  return formatProofForSolana(proof);
}
```

---

## Phase 4: Relayer Service (For True Anonymity)

### Step 4.1: Edge Function Relayer
```typescript
// supabase/functions/rift-relayer/index.ts
Deno.serve(async (req) => {
  const { proof, nullifierHash, recipient, poolType } = await req.json();
  
  // Verify proof is valid
  // Submit transaction on behalf of user
  // Deduct relayer fee
  
  const signature = await submitWithdrawal(proof, nullifierHash, recipient);
  return Response.json({ signature });
});
```

### Step 4.2: Fee Structure
- Relayer pays gas fees
- Takes 0.3% fee from withdrawal
- User's wallet never touches the withdrawal transaction

---

## Phase 5: Database Tracking (Optional)

### Step 5.1: Tables for Analytics
```sql
-- Track deposits (public info only)
CREATE TABLE mixer_deposits (
  id UUID PRIMARY KEY,
  commitment TEXT NOT NULL,
  pool_type TEXT NOT NULL,
  leaf_index INTEGER NOT NULL,
  tx_signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track withdrawals (public info only)
CREATE TABLE mixer_withdrawals (
  id UUID PRIMARY KEY,
  nullifier_hash TEXT NOT NULL,
  pool_type TEXT NOT NULL,
  tx_signature TEXT NOT NULL,
  relayer_fee NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Deposit    │     │    Store     │     │   Withdraw   │    │
│  │     Form     │     │    Note      │     │     Form     │    │
│  └──────┬───────┘     └──────────────┘     └──────┬───────┘    │
│         │                                          │            │
│         ▼                                          ▼            │
│  ┌──────────────┐                          ┌──────────────┐    │
│  │   Generate   │                          │   Generate   │    │
│  │  Commitment  │                          │   ZK Proof   │    │
│  └──────┬───────┘                          └──────┬───────┘    │
│         │                                          │            │
└─────────┼──────────────────────────────────────────┼────────────┘
          │                                          │
          ▼                                          ▼
┌─────────────────────┐                   ┌─────────────────────┐
│   SOLANA NETWORK    │                   │   RELAYER SERVICE   │
├─────────────────────┤                   ├─────────────────────┤
│                     │                   │                     │
│  ┌───────────────┐  │                   │  Submits withdraw   │
│  │ RIFT Program  │  │◄──────────────────│  on user's behalf   │
│  ├───────────────┤  │                   │                     │
│  │ • Pools       │  │                   └─────────────────────┘
│  │ • Merkle Tree │  │
│  │ • Nullifiers  │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

---

## Checklist

### You (Contract Owner)
- [ ] Deploy contract to devnet
- [ ] Test deposit/withdraw flow
- [ ] Deploy to mainnet
- [ ] Provide Program ID + IDL to Lovable

### Me (Lovable)
- [ ] Integrate Program ID + IDL
- [ ] Update deposit function with real calls
- [ ] Update withdraw function with real calls
- [ ] Add pool stats from on-chain
- [ ] Create relayer edge function
- [ ] Add database tracking

### Later (Advanced)
- [ ] Implement ZK circuits (Circom)
- [ ] Generate proving keys
- [ ] Add client-side proof generation
- [ ] Security audit
- [ ] Mainnet launch

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Contract Deploy | 1-2 days | Solana Playground |
| Frontend Integration | 1 day | Program ID + IDL |
| Basic Testing | 1-2 days | Devnet SOL |
| ZK Circuits | 2-4 weeks | Circom expertise |
| Security Audit | 2-4 weeks | Audit firm |
| Mainnet Launch | 1 day | All above |

---

## Cost Estimates

| Item | Cost |
|------|------|
| Devnet Deployment | Free |
| Mainnet Deployment | ~2-5 SOL |
| RPC Provider (Helius) | $0-49/month |
| Security Audit | $50,000-200,000 |
| ZK Development | $20,000-100,000 |

---

## Questions?

Once you deploy the contract and provide the Program ID, I'll immediately integrate it into the frontend!
