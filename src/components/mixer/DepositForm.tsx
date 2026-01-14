import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Loader2, Shield, Copy, Check, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUmbraClient } from "@/hooks/useUmbraClient";
import { PoolType, DepositNote } from "@/lib/umbra";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { PoolSelector } from "./PoolSelector";

type DepositStep = "select" | "confirm" | "processing" | "complete";

const MIN_DEPOSIT = 0.1;
const MAX_DEPOSIT = 1000;

export function DepositForm() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { balance } = useWalletConnection();
  const client = useUmbraClient();

  const [step, setStep] = useState<DepositStep>("select");
  const [selectedPool, setSelectedPool] = useState<PoolType>("SOL");
  const [customAmount, setCustomAmount] = useState("");
  const [depositNote, setDepositNote] = useState<DepositNote | null>(null);
  const [encodedNote, setEncodedNote] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const numAmount = parseFloat(customAmount) || 0;
  const isValidAmount = numAmount >= MIN_DEPOSIT && 
                        numAmount <= MAX_DEPOSIT &&
                        (balance === null || numAmount <= balance);

  const handleMaxClick = () => {
    if (balance !== null) {
      const maxDeposit = Math.min(balance - 0.01, MAX_DEPOSIT);
      setCustomAmount(Math.max(0, maxDeposit).toFixed(4));
    }
  };

  const formatSOL = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const handleDeposit = useCallback(async () => {
    if (!publicKey) {
      setVisible(true);
      return;
    }

    if (!isValidAmount) {
      toast.error("Invalid amount");
      return;
    }

    // Generate deposit note with custom amount
    const note = client.generateDepositNote(selectedPool, 0, numAmount);
    const encoded = client.encodeDepositNote(note);
    setDepositNote(note);
    setEncodedNote(encoded);
    setStep("confirm");
  }, [publicKey, client, selectedPool, numAmount, isValidAmount, setVisible]);

  const handleConfirmDeposit = useCallback(async () => {
    if (!publicKey || !depositNote) return;

    setStep("processing");

    try {
      await client.simulateDeposit(publicKey, depositNote);
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
    a.download = `rift-note-${selectedPool}-${Date.now()}.txt`;
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
    setCustomAmount("");
  }, []);

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-[#FFCC00] animate-spin" />
          <Shield className="h-8 w-8 text-[#FFCC00] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2 font-inter">
            Processing Deposit
          </h3>
          <p className="text-white/60 font-inter">
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
          <div className="w-16 h-16 rounded-full bg-[#FFCC00]/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-[#FFCC00]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 font-inter">
            Deposit Complete!
          </h3>
          <p className="text-white/60 font-inter">
            {depositNote?.amount} {selectedPool} deposited to privacy pool
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm font-inter">
                IMPORTANT: Save your withdrawal note
              </p>
              <p className="text-white/60 text-sm mt-1 font-inter">
                This note is required to withdraw your funds. If you lose it, your funds will be unrecoverable.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm mb-2 font-inter">Your withdrawal note:</p>
          <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-white/80 break-all max-h-24 overflow-y-auto">
            {encodedNote}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopyNote}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all font-inter"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Note"}
          </button>
          <button
            onClick={handleDownloadNote}
            className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all font-inter",
              noteSaved
                ? "border-[#FFCC00] bg-[#FFCC00]/20 text-[#FFCC00]"
                : "border-[#FFCC00] bg-[#FFCC00] text-black hover:bg-[#FFD735]"
            )}
          >
            {noteSaved ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {noteSaved ? "Saved!" : "Download Note"}
          </button>
        </div>

        <button
          onClick={handleNewDeposit}
          className="w-full p-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all font-inter"
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
          <h3 className="text-xl font-semibold text-white mb-2 font-inter">
            Confirm Deposit
          </h3>
          <p className="text-white/60 font-inter">
            Review your deposit details before proceeding
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60 font-inter">Amount</span>
            <span className="text-white font-semibold font-inter">
              {numAmount} {selectedPool}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60 font-inter">Pool</span>
            <span className="text-white font-semibold font-inter">{selectedPool}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60 font-inter">Anonymity Set</span>
            <span className="text-[#FFCC00] font-semibold font-inter">
              {client.getPoolInfo(selectedPool).anonymitySet.toLocaleString()} deposits
            </span>
          </div>
        </div>

        <div className="bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-[#FFCC00] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm font-inter">
                Zero-Knowledge Privacy
              </p>
              <p className="text-white/60 text-sm mt-1 font-inter">
                Your deposit will be mixed with {client.getPoolInfo(selectedPool).anonymitySet.toLocaleString()} other deposits, making it virtually impossible to trace.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setStep("select")}
            className="p-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all font-inter"
          >
            Back
          </button>
          <button
            onClick={handleConfirmDeposit}
            className="p-3 rounded-xl bg-[#FFCC00] text-black font-semibold hover:bg-[#FFD735] transition-all font-inter"
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
        <h3 className="text-white font-semibold mb-3 font-inter">Select Token</h3>
        <PoolSelector
          selectedPool={selectedPool}
          onSelectPool={setSelectedPool}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold font-inter">Enter Amount</h3>
          {connected && (
            <span className="text-white/60 text-sm font-inter">
              Balance: {balance !== null ? `${formatSOL(balance)} SOL` : "Loading..."}
            </span>
          )}
        </div>
        
        <div className="relative">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-2xl h-16 px-4 pr-24 font-inter font-bold focus:outline-none focus:border-[#FFCC00] transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <button
              onClick={handleMaxClick}
              className="text-xs text-[#FFCC00] hover:text-[#FFD735] font-inter font-semibold"
            >
              MAX
            </button>
            <span className="text-white/40 text-sm font-inter">{selectedPool}</span>
          </div>
        </div>
        
        {numAmount > 0 && !isValidAmount && (
          <p className="text-red-400 text-xs mt-2 font-inter">
            {numAmount < MIN_DEPOSIT
              ? `Minimum deposit is ${MIN_DEPOSIT} ${selectedPool}`
              : numAmount > MAX_DEPOSIT
              ? `Maximum deposit is ${MAX_DEPOSIT} ${selectedPool}`
              : "Insufficient balance"}
          </p>
        )}
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex justify-between text-sm">
          <span className="text-white/60 font-inter">Pool Anonymity Set</span>
          <span className="text-[#FFCC00] font-semibold font-inter">
            {client.getPoolInfo(selectedPool).anonymitySet.toLocaleString()} deposits
          </span>
        </div>
      </div>

      <button
        onClick={connected ? handleDeposit : () => setVisible(true)}
        disabled={connected && !isValidAmount}
        className="w-full p-4 rounded-xl bg-[#FFCC00] text-black font-semibold hover:bg-[#FFD735] transition-all duration-200 shadow-[0_0_20px_0_rgba(255,204,0,0.3)] hover:shadow-[0_0_30px_0_rgba(255,204,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed font-inter"
      >
        {connected ? "Deposit to Privacy Pool" : "Connect Wallet to Deposit"}
      </button>
    </div>
  );
}
