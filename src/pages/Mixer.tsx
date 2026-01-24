import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Loader2, Check, Copy, Download, AlertTriangle, Key } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useToast } from "@/hooks/use-toast";

type MixStep = "amount" | "deposit" | "processing" | "complete";

const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 10;

export default function Mixer() {
  const [step, setStep] = useState<MixStep>("amount");
  const [amount, setAmount] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [outputAddress, setOutputAddress] = useState<string | null>(null);
  const [outputPrivateKey, setOutputPrivateKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const { connected, publicKey } = useWalletConnection();
  const { toast } = useToast();

  const parsedAmount = parseFloat(amount) || 0;
  const isValidAmount = parsedAmount >= MIN_AMOUNT && parsedAmount <= MAX_AMOUNT;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, []);

  const handleStartMix = async () => {
    if (!connected || !publicKey || !isValidAmount) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-mix-wallet", {
        body: { userWallet: publicKey.toBase58(), amountSol: parsedAmount },
      });

      if (error || !data?.success) throw new Error(data?.error || "Failed to generate wallet");

      setSessionId(data.sessionId);
      setDepositAddress(data.depositAddress);
      setExpiresAt(new Date(data.expiresAt));
      setStep("deposit");
      startDetection(data.sessionId);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const startDetection = (sid: string) => {
    setIsDetecting(true);
    detectionInterval.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("detect-mix-transaction", {
          body: { sessionId: sid },
        });

        if (data?.found && data?.status === "deposit_detected") {
          clearInterval(detectionInterval.current!);
          toast({ title: "Deposit detected!", description: "Processing your mix..." });
          setStep("processing");
          processMix(sid);
        } else if (data?.status === "expired") {
          clearInterval(detectionInterval.current!);
          toast({ title: "Session expired", variant: "destructive" });
          resetMixer();
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 5000);
  };

  const processMix = async (sid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("process-mix", {
        body: { sessionId: sid },
      });

      if (error || !data?.success) throw new Error(data?.error || "Mix failed");

      setOutputAddress(data.outputAddress);
      setOutputPrivateKey(data.outputPrivateKey);
      setStep("complete");
      toast({ title: "Mix complete!", description: "Your fresh wallet is ready" });
    } catch (err) {
      toast({ title: "Mix failed", description: (err as Error).message, variant: "destructive" });
      resetMixer();
    }
  };

  const resetMixer = () => {
    if (detectionInterval.current) clearInterval(detectionInterval.current);
    setStep("amount");
    setAmount("");
    setSessionId(null);
    setDepositAddress(null);
    setOutputAddress(null);
    setOutputPrivateKey(null);
    setIsDetecting(false);
  };

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadKey = () => {
    if (!outputPrivateKey || !outputAddress) return;
    const content = `RIFT Privacy Mixer - Fresh Wallet\n\nAddress: ${outputAddress}\nPrivate Key: ${outputPrivateKey}\n\n⚠️ Keep this file secure! Anyone with the private key can access these funds.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rift-wallet-${outputAddress.slice(0, 8)}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-wallet/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-wallet" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Privacy Mixer</h1>
            <p className="text-white/60">Send SOL, receive fresh untraceable funds</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {["Amount", "Deposit", "Processing", "Complete"].map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= ["amount", "deposit", "processing", "complete"].indexOf(step) 
                    ? "bg-wallet text-black" : "bg-white/10 text-white/40"
                }`}>{i + 1}</div>
                <span className="text-xs mt-1 text-white/60">{s}</span>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            {/* Step 1: Amount */}
            {step === "amount" && (
              <div className="space-y-6">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Amount to Mix (SOL)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-2xl h-14"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step="0.01"
                  />
                  <p className="text-white/40 text-xs mt-2">Min: {MIN_AMOUNT} SOL • Max: {MAX_AMOUNT} SOL</p>
                </div>
                <Button
                  onClick={handleStartMix}
                  disabled={!connected || !isValidAmount || isGenerating}
                  className="w-full h-12 bg-wallet hover:bg-wallet/90 text-black font-semibold"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2" /> : null}
                  {!connected ? "Connect Wallet" : "Start Mix"}
                </Button>
              </div>
            )}

            {/* Step 2: Deposit */}
            {step === "deposit" && depositAddress && (
              <div className="space-y-6 text-center">
                <p className="text-white/60">Send exactly <span className="text-wallet font-bold">{parsedAmount} SOL</span> to:</p>
                <div className="bg-white p-4 rounded-xl inline-block">
                  <QRCodeSVG value={`solana:${depositAddress}?amount=${parsedAmount}`} size={180} />
                </div>
                <div className="bg-white/5 rounded-lg p-3 flex items-center gap-2">
                  <code className="text-white/80 text-xs flex-1 break-all">{depositAddress}</code>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(depositAddress, "address")}>
                    {copied === "address" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {isDetecting && (
                  <div className="flex items-center justify-center gap-2 text-wallet">
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span className="text-sm">Waiting for transaction...</span>
                  </div>
                )}
                <Button variant="outline" onClick={resetMixer} className="border-white/20 text-white/60">Cancel</Button>
              </div>
            )}

            {/* Step 3: Processing */}
            {step === "processing" && (
              <div className="text-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-wallet mx-auto" />
                <h3 className="text-xl font-semibold text-white">Processing Mix</h3>
                <p className="text-white/60">Generating fresh wallet and transferring funds...</p>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === "complete" && outputAddress && outputPrivateKey && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Mix Complete!</h3>
                  <p className="text-white/60 text-sm">Your fresh wallet with {parsedAmount} SOL</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <label className="text-white/40 text-xs mb-1 block">Fresh Wallet Address</label>
                    <div className="flex items-center gap-2">
                      <code className="text-white/80 text-xs flex-1 break-all">{outputAddress}</code>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(outputAddress, "output")}>
                        {copied === "output" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-wallet/10 border border-wallet/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-wallet" />
                      <label className="text-wallet text-xs font-semibold">Private Key (Save this!)</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-white/80 text-xs flex-1 break-all line-clamp-2">{outputPrivateKey.slice(0, 50)}...</code>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(outputPrivateKey, "key")}>
                        {copied === "key" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-yellow-500/90 text-xs">Save your private key now! It will not be shown again. Anyone with this key can access your funds.</p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleDownloadKey} variant="outline" className="flex-1 border-wallet/30 text-wallet">
                    <Download className="h-4 w-4 mr-2" /> Download Key
                  </Button>
                  <Button onClick={resetMixer} className="flex-1 bg-wallet hover:bg-wallet/90 text-black">
                    New Mix
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
