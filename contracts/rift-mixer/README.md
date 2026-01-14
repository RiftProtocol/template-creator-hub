# RIFT Privacy Mixer - Solana Smart Contract

A zero-knowledge privacy mixer for Solana that enables anonymous SOL transfers.

## Overview

The RIFT Mixer allows users to:
1. **Deposit** fixed amounts of SOL into privacy pools
2. **Wait** for other deposits to mix with
3. **Withdraw** to any wallet without linking to the original deposit

## Pool Types

| Pool | Deposit Amount |
|------|---------------|
| Sol0_1 | 0.1 SOL |
| Sol1 | 1 SOL |
| Sol10 | 10 SOL |
| Sol100 | 100 SOL |

## Deployment Instructions

### Option 1: Solana Playground (Recommended for beginners)

1. Go to [https://beta.solpg.io](https://beta.solpg.io)
2. Create a new Anchor project
3. Copy the contents of `programs/rift-mixer/src/lib.rs`
4. Click "Build" then "Deploy"
5. Copy the Program ID after deployment

### Option 2: Local Anchor CLI

```bash
# Install dependencies
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## After Deployment

1. Copy the **Program ID** (e.g., `RiFT...xxx`)
2. Run `anchor idl init` to upload the IDL
3. Update the frontend with the new Program ID

## Program Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    RIFT MIXER PROGRAM                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │    Pool      │    │ MerkleTree   │    │ Nullifier │ │
│  │   Account    │    │   Account    │    │ Registry  │ │
│  ├──────────────┤    ├──────────────┤    ├───────────┤ │
│  │ - authority  │    │ - leaves[]   │    │ - used[]  │ │
│  │ - pool_type  │    │ - subtrees[] │    │           │ │
│  │ - amount     │    │              │    │           │ │
│  │ - deposits   │    │              │    │           │ │
│  │ - merkle_root│    │              │    │           │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                     INSTRUCTIONS                         │
├─────────────────────────────────────────────────────────┤
│  initialize()  - Create new pool                        │
│  deposit()     - Add commitment, transfer SOL           │
│  withdraw()    - Verify proof, release SOL              │
│  get_stats()   - Read pool statistics                   │
└─────────────────────────────────────────────────────────┘
```

## Security Considerations

⚠️ **IMPORTANT**: Before mainnet deployment:

1. **ZK Proof Verification**: The `verify_proof` function is a placeholder. 
   Integrate a real ZK library (arkworks, bellman) for production.

2. **Audit Required**: Get a professional security audit before handling real funds.

3. **Merkle Tree Size**: Current implementation stores leaves on-chain. 
   Consider using compression or off-chain storage for scale.

4. **Relayer**: Set up a relayer service for true anonymity.

## Integration with Frontend

After deployment, update the frontend:

```typescript
// src/lib/umbra/config.ts
export const RIFT_PROGRAM_ID = "YOUR_DEPLOYED_PROGRAM_ID";
export const RIFT_IDL = { /* paste IDL here */ };
```

## Testing

```bash
# Run tests on devnet
anchor test

# Run specific test
anchor test --skip-local-validator
```

## License

MIT
