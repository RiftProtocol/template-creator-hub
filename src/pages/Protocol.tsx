import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Zap, Users, Code, FileText, Github, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { VideoBackground } from "@/components/layout/VideoBackground";
import { RIFT_FEATURES, PRIVACY_POOLS, CRYPTO_PARAMS, TOKENOMICS } from "@/lib/protocol/constants";

export default function Protocol() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <VideoBackground />
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">RIFT Protocol</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Privacy-first DeFi infrastructure powered by zero-knowledge proofs, 
            stake-powered economics, and decentralized governance.
          </p>
        </div>

        {/* Core Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Shield className="w-6 h-6 text-wallet" /> Core Innovations
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-wallet/20 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-wallet" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Stake-Powered Privacy</h3>
              <p className="text-muted-foreground text-sm">
                {(RIFT_FEATURES.STAKING_FEE_SHARE * 100)}% of mixer fees flow to stakers, 
                creating self-sustaining privacy infrastructure.
              </p>
            </div>
            <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-wallet/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-wallet" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Dynamic Anonymity</h3>
              <p className="text-muted-foreground text-sm">
                Pools with {RIFT_FEATURES.ANONYMITY_TIERS.MAXIMUM.minDeposits}+ deposits unlock 
                {RIFT_FEATURES.ANONYMITY_TIERS.MAXIMUM.multiplier}x reward multipliers.
              </p>
            </div>
            <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-wallet/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-wallet" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Relayer Network</h3>
              <p className="text-muted-foreground text-sm">
                Stake {RIFT_FEATURES.RELAYER.MIN_STAKE_TO_RUN} SOL to run a relayer node and 
                earn {RIFT_FEATURES.RELAYER.FEE_SHARE * 100}% of transaction fees.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Pools */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Privacy Pools</h2>
          <div className="bg-card/50 backdrop-blur border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Pool</th>
                  <th className="text-right p-4 font-medium">Amount</th>
                  <th className="text-right p-4 font-medium">Target Anonymity</th>
                  <th className="text-right p-4 font-medium">Fee</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(PRIVACY_POOLS).map((pool) => (
                  <tr key={pool.id} className="border-t border-border">
                    <td className="p-4 font-medium">{pool.name}</td>
                    <td className="p-4 text-right">{pool.amount} {pool.symbol}</td>
                    <td className="p-4 text-right">{pool.anonymityTarget} deposits</td>
                    <td className="p-4 text-right text-muted-foreground">{pool.feeRate * 100}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cryptography */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Code className="w-6 h-6 text-wallet" /> Cryptographic Design
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Parameters</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Merkle Tree Height</span>
                  <span>{CRYPTO_PARAMS.MERKLE_TREE_HEIGHT} levels (1M+ deposits)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Hash Function</span>
                  <span className="uppercase">{CRYPTO_PARAMS.HASH_FUNCTION}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Proof System</span>
                  <span className="uppercase">{CRYPTO_PARAMS.PROOF_SYSTEM}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Curve</span>
                  <span className="uppercase">{CRYPTO_PARAMS.CURVE}</span>
                </li>
              </ul>
            </div>
            <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Security Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ On-chain nullifier tracking prevents double-spend</li>
                <li>✓ Root history enables async withdrawals</li>
                <li>✓ Groth16 proofs verify in &lt;1ms</li>
                <li>✓ 128-bit security level</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tokenomics */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Token Economics</h2>
          <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(TOKENOMICS.DISTRIBUTION).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{key.toLowerCase()}</span>
                        <span>{value * 100}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-wallet rounded-full"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Total Supply</h3>
                <p className="text-3xl font-bold text-wallet mb-4">
                  {(TOKENOMICS.TOTAL_SUPPLY / 1_000_000_000).toFixed(0)}B RIFT
                </p>
                <p className="text-sm text-muted-foreground">
                  Value accrual through fee burning, staking demand, and governance utility.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Smart Contracts */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <FileText className="w-6 h-6 text-wallet" /> Smart Contracts
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Privacy Mixer", desc: "ZK-proof deposits & withdrawals", file: "rift-mixer" },
              { name: "Staking", desc: "Tiered staking & relayer network", file: "rift-staking" },
              { name: "Governance", desc: "DAO proposals & voting", file: "rift-governance" },
            ].map((contract) => (
              <div key={contract.file} className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-2">{contract.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{contract.desc}</p>
                <div className="flex items-center gap-2 text-xs text-wallet">
                  <Github className="w-4 h-4" />
                  <span>contracts/{contract.file}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-wallet/20 to-wallet/5 border border-wallet/30 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-muted-foreground mb-6">
              Review the whitepaper, explore the contracts, and join the privacy revolution.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/mix" 
                className="bg-wallet text-wallet-foreground px-6 py-3 rounded-lg font-medium hover:bg-wallet-hover transition-colors"
              >
                Launch Mixer
              </Link>
              <a 
                href="https://github.com/rift-protocol" 
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors inline-flex items-center gap-2"
              >
                <Github className="w-4 h-4" /> GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
