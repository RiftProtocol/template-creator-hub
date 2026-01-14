import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Loader2, Shield, Copy, Check, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUmbraClient } from "@/hooks/useUmbraClient";
import { PoolType, DepositNote, DEPOSIT_AMOUNTS_DISPLAY } from "@/lib/umbra";
import { PoolSelector } from "./PoolSelector";
import { AmountSelector } from "./AmountSelector";

type DepositStep = "select" | "confirm" | "processing" | "complete";

export function DepositForm() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const client = useUmbraClient();

  const [step, setStep] = useState<DepositStep>("select");
  const [selectedPool, setSelectedPool] = useState<PoolType>("SOL");
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(0);
  const [depositNote, setDepositNote] = useState<DepositNote | null>(null);
  const [encodedNote, setEncodedNote] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const handleDeposit = useCallback(async () => {
    if (!publicKey) {
      setVisible(true);
      return;
    }

    // Generate deposit note
    const note = client.generateDepositNote(selectedPool, selectedAmountIndex);
    const encoded = client.encodeDepositNote(note);
    setDepositNote(note);
    setEncodedNote(encoded);
    setStep("confirm");
  }, [publicKey, client, selectedPool, selectedAmountIndex, setVisible]);

  const handleConfirmDeposit = useCallback(async () => {
    if (!publicKey || !depositNote) return;

    setStep("processing");

    try {
      // In production, this would send the actual transaction
      await client.simulateDeposit(publicKey, depositNote);
      
      // Save deposit to local storage
      client.saveDeposit(depositNote);
      
      setStep("complete");
      toast.success("Deposit successful!", {
        description: "Your funds are now private. Save your note to withdraw later.",
      });
    } catch (error) {
      console.error("Deposit failed:", error);
      toast.error("Deposit failed", {
        description: "Please try again.",
      });
      setStep("confirm");
    }
  }, [publicKey, depositNote, client]);

  const handleCopyNote = useCallback(() => {
    navigator.clipboard.writeText(encodedNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Note copied to clipboard");
  }, [encodedNote]);

  const handleDownloadNote = useCallback(() => {
    const blob = new Blob([encodedNote], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `umbra-note-${selectedPool}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNoteSaved(true);
    toast.success("Note downloaded successfully");
  }, [encodedNote, selectedPool]);

  const handleNewDeposit = useCallback(() => {
    setStep("select");
    setDepositNote(null);
    setEncodedNote("");
    setCopied(false);
    setNoteSaved(false);
  }, []);

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-wallet animate-spin" />
          <Shield className="h-8 w-8 text-wallet absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Processing Deposit
          </h3>
          <p className="text-white/60">
            Generating zero-knowledge proof and submitting transaction...
          </p>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-wallet/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-wallet" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Deposit Complete!
          </h3>
          <p className="text-white/60">
            {DEPOSIT_AMOUNTS_DISPLAY[selectedPool][selectedAmountIndex]} deposited to privacy pool
          </p>
        </div>

        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">
                IMPORTANT: Save your withdrawal note
              </p>
              <p className="text-white/60 text-sm mt-1">
                This note is required to withdraw your funds. If you lose it, your funds will be unrecoverable.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm mb-2">Your withdrawal note:</p>
          <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-white/80 break-all max-h-24 overflow-y-auto">
            {encodedNote}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopyNote}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Note"}
          </button>
          <button
            onClick={handleDownloadNote}
            className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
              noteSaved
                ? "border-wallet bg-wallet/20 text-wallet"
                : "border-wallet bg-wallet text-black hover:bg-wallet-hover"
            )}
          >
            {noteSaved ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {noteSaved ? "Saved!" : "Download Note"}
          </button>
        </div>

        <button
          onClick={handleNewDeposit}
          className="w-full p-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all"
        >
          Make Another Deposit
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-4">
          <h3 className="text-xl font-semibold text-white mb-2">
            Confirm Deposit
          </h3>
          <p className="text-white/60">
            Review your deposit details before proceeding
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60">Amount</span>
            <span className="text-white font-semibold">
              {DEPOSIT_AMOUNTS_DISPLAY[selectedPool][selectedAmountIndex]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Pool</span>
            <span className="text-white font-semibold">{selectedPool}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Anonymity Set</span>
            <span className="text-wallet font-semibold">
              {client.getPoolInfo(selectedPool).anonymitySet.toLocaleString()} deposits
            </span>
          </div>
        </div>

        <div className="bg-wallet/10 border border-wallet/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-wallet flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">
                Zero-Knowledge Privacy
              </p>
              <p className="text-white/60 text-sm mt-1">
                Your deposit will be mixed with {client.getPoolInfo(selectedPool).anonymitySet.toLocaleString()} other deposits, making it virtually impossible to trace.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setStep("select")}
            className="p-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all"
          >
            Back
          </button>
          <button
            onClick={handleConfirmDeposit}
            className="p-3 rounded-xl bg-wallet text-black font-semibold hover:bg-wallet-hover transition-all"
          >
            Confirm Deposit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-white font-semibold mb-3">Select Token</h3>
        <PoolSelector
          selectedPool={selectedPool}
          onSelectPool={setSelectedPool}
        />
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3">Select Amount</h3>
        <AmountSelector
          poolType={selectedPool}
          selectedIndex={selectedAmountIndex}
          onSelectIndex={setSelectedAmountIndex}
        />
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Pool Anonymity Set</span>
          <span className="text-wallet font-semibold">
            {client.getPoolInfo(selectedPool).anonymitySet.toLocaleString()} deposits
          </span>
        </div>
      </div>

      <button
        onClick={connected ? handleDeposit : () => setVisible(true)}
        className="w-full p-4 rounded-xl bg-wallet text-black font-semibold hover:bg-wallet-hover transition-all duration-200 shadow-[0_0_20px_0_hsl(48_100%_50%/0.3)] hover:shadow-[0_0_30px_0_hsl(48_100%_50%/0.5)]"
      >
        {connected ? "Deposit to Privacy Pool" : "Connect Wallet to Deposit"}
      </button>
    </div>
  );
}
