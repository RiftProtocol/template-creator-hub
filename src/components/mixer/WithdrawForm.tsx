import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  Loader2,
  Shield,
  FileText,
  Trash2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUmbraClient } from "@/hooks/useUmbraClient";
import { DepositNote, POOL_INFO, DEPOSIT_AMOUNTS } from "@/lib/umbra";

type WithdrawStep = "input" | "confirm" | "processing" | "complete";

export function WithdrawForm() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const client = useUmbraClient();

  const [step, setStep] = useState<WithdrawStep>("input");
  const [noteInput, setNoteInput] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [parsedNote, setParsedNote] = useState<DepositNote | null>(null);
  const [savedNotes, setSavedNotes] = useState<DepositNote[]>([]);
  const [withdrawSignature, setWithdrawSignature] = useState("");

  // Load saved notes on mount
  useEffect(() => {
    setSavedNotes(client.getDepositHistory());
  }, [client]);

  const formatAmount = (note: DepositNote): string => {
    const poolInfo = POOL_INFO[note.poolType];
    const decimals = poolInfo.decimals;
    const amount = note.amount / Math.pow(10, decimals);
    return `${amount.toLocaleString()} ${poolInfo.symbol}`;
  };

  const handleParseNote = useCallback(() => {
    const note = client.decodeDepositNote(noteInput.trim());
    if (!note) {
      toast.error("Invalid note", {
        description: "Please check your withdrawal note and try again.",
      });
      return;
    }
    setParsedNote(note);
    setStep("confirm");
  }, [noteInput, client]);

  const handleSelectSavedNote = useCallback((note: DepositNote) => {
    setParsedNote(note);
    setNoteInput(client.encodeDepositNote(note));
    setStep("confirm");
  }, [client]);

  const handleDeleteSavedNote = useCallback(
    (note: DepositNote, e: React.MouseEvent) => {
      e.stopPropagation();
      client.removeDeposit(note.commitment);
      setSavedNotes(client.getDepositHistory());
      toast.success("Note removed from history");
    },
    [client]
  );

  const handleWithdraw = useCallback(async () => {
    if (!parsedNote) return;

    // Validate recipient
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = recipientInput
        ? new PublicKey(recipientInput)
        : publicKey!;
    } catch {
      toast.error("Invalid recipient address");
      return;
    }

    setStep("processing");

    try {
      const result = await client.simulateWithdraw(parsedNote, recipientPubkey);
      
      // Remove from saved notes
      client.removeDeposit(parsedNote.commitment);
      setSavedNotes(client.getDepositHistory());
      
      setWithdrawSignature(result.signature);
      setStep("complete");
      
      toast.success("Withdrawal successful!", {
        description: "Your funds have been sent to the recipient address.",
      });
    } catch (error) {
      console.error("Withdrawal failed:", error);
      toast.error("Withdrawal failed", {
        description: "Please try again.",
      });
      setStep("confirm");
    }
  }, [parsedNote, recipientInput, publicKey, client]);

  const handleNewWithdraw = useCallback(() => {
    setStep("input");
    setNoteInput("");
    setRecipientInput("");
    setParsedNote(null);
    setWithdrawSignature("");
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
            Processing Withdrawal
          </h3>
          <p className="text-white/60">
            Generating zero-knowledge proof... This may take a moment.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-wallet rounded-full animate-pulse w-2/3" />
          </div>
          <p className="text-white/40 text-xs text-center mt-2">
            ZK proof generation in progress
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
            <CheckCircle2 className="h-8 w-8 text-wallet" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Withdrawal Complete!
          </h3>
          <p className="text-white/60">
            Your private funds have been withdrawn successfully.
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60">Amount</span>
            <span className="text-white font-semibold">
              {parsedNote && formatAmount(parsedNote)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Transaction</span>
            <a
              href={`https://solscan.io/tx/${withdrawSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-wallet hover:underline"
            >
              View on Solscan
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <button
          onClick={handleNewWithdraw}
          className="w-full p-3 rounded-xl bg-wallet text-black font-semibold hover:bg-wallet-hover transition-all"
        >
          Make Another Withdrawal
        </button>
      </div>
    );
  }

  if (step === "confirm" && parsedNote) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-4">
          <h3 className="text-xl font-semibold text-white mb-2">
            Confirm Withdrawal
          </h3>
          <p className="text-white/60">
            Review your withdrawal details before proceeding
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60">Amount</span>
            <span className="text-white font-semibold">
              {formatAmount(parsedNote)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Pool</span>
            <span className="text-white font-semibold">
              {parsedNote.poolType}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Deposited</span>
            <span className="text-white/80">
              {new Date(parsedNote.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">
            Recipient Address (optional - defaults to connected wallet)
          </label>
          <input
            type="text"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            placeholder={publicKey?.toBase58() || "Enter recipient address..."}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-wallet transition-colors font-mono text-sm"
          />
        </div>

        <div className="bg-wallet/10 border border-wallet/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-wallet flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">
                Privacy Protected
              </p>
              <p className="text-white/60 text-sm mt-1">
                The ZK proof ensures no link between your deposit and withdrawal can be traced on-chain.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setStep("input")}
            className="p-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all"
          >
            Back
          </button>
          <button
            onClick={connected ? handleWithdraw : () => setVisible(true)}
            className="p-3 rounded-xl bg-wallet text-black font-semibold hover:bg-wallet-hover transition-all"
          >
            {connected ? "Withdraw" : "Connect Wallet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Saved Notes */}
      {savedNotes.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">Your Deposits</h3>
          <div className="space-y-2">
            {savedNotes.map((note) => (
              <button
                key={note.commitment}
                onClick={() => handleSelectSavedNote(note)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:border-wallet hover:bg-wallet/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-wallet/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-wallet" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">
                      {formatAmount(note)}
                    </p>
                    <p className="text-white/60 text-sm">
                      {new Date(note.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSavedNote(note, e)}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Note Input */}
      <div>
        <h3 className="text-white font-semibold mb-3">
          {savedNotes.length > 0 ? "Or Enter Note Manually" : "Enter Withdrawal Note"}
        </h3>
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Paste your withdrawal note here..."
          rows={4}
          className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-wallet transition-colors font-mono text-sm resize-none"
        />
      </div>

      <button
        onClick={handleParseNote}
        disabled={!noteInput.trim()}
        className={cn(
          "w-full p-4 rounded-xl font-semibold transition-all duration-200",
          noteInput.trim()
            ? "bg-wallet text-black hover:bg-wallet-hover shadow-[0_0_20px_0_hsl(48_100%_50%/0.3)] hover:shadow-[0_0_30px_0_hsl(48_100%_50%/0.5)]"
            : "bg-white/10 text-white/40 cursor-not-allowed"
        )}
      >
        Verify Note & Continue
      </button>

      <div className="bg-white/5 rounded-xl p-4 text-center">
        <p className="text-white/60 text-sm">
          Don't have a note?{" "}
          <span className="text-wallet">
            Make a deposit first to receive a withdrawal note.
          </span>
        </p>
      </div>
    </div>
  );
}
