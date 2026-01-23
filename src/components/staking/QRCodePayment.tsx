import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { STAKING_CONFIG, formatSOL } from "@/lib/staking";

interface QRCodePaymentProps {
  amount: number;
  isDetecting: boolean;
  onCancel: () => void;
}

export function QRCodePayment({ amount, isDetecting, onCancel }: QRCodePaymentProps) {
  const [copied, setCopied] = useState(false);
  
  const treasuryAddress = STAKING_CONFIG.TREASURY_WALLET;
  
  // Create a Solana Pay URL for better wallet compatibility
  const solanaPayUrl = `solana:${treasuryAddress}?amount=${amount}&label=Rift%20Protocol%20Stake&message=Stake%20${amount}%20SOL`;
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(treasuryAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-white font-inter font-semibold text-[20px] mb-2">
          Send {formatSOL(amount, 2)} SOL
        </h3>
        <p className="text-white/60 text-[14px] font-inter">
          Scan the QR code or copy the address below
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-2xl">
          <QRCodeSVG
            value={solanaPayUrl}
            size={200}
            level="H"
            includeMargin={false}
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </div>
      </div>

      {/* Amount Display */}
      <div className="bg-gradient-to-r from-[#FFCC00]/10 to-green-500/10 border border-[#FFCC00]/20 rounded-xl p-4 text-center">
        <span className="text-white/60 text-[14px] font-inter">Amount to send</span>
        <p className="text-[#FFCC00] font-inter font-bold text-[28px]">
          {formatSOL(amount, 4)} SOL
        </p>
      </div>

      {/* Address with copy */}
      <div className="space-y-2">
        <label className="text-white/60 text-[12px] font-inter">Treasury Address</label>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
          <code className="flex-1 text-white text-[12px] font-mono truncate">
            {treasuryAddress}
          </code>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4 text-white/60" />
            )}
          </button>
        </div>
      </div>

      {/* Detection Status */}
      <div className="flex items-center justify-center gap-3 py-4">
        {isDetecting ? (
          <>
            <Loader2 className="h-5 w-5 text-[#FFCC00] animate-spin" />
            <span className="text-white/80 text-[14px] font-inter">
              Waiting for transaction...
            </span>
          </>
        ) : (
          <span className="text-white/60 text-[14px] font-inter">
            Transaction will be detected automatically
          </span>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
        <h4 className="text-white font-inter font-semibold text-[14px]">Instructions</h4>
        <ol className="space-y-1 text-white/60 text-[13px] font-inter list-decimal list-inside">
          <li>Open your Solana wallet app</li>
          <li>Scan the QR code or paste the address</li>
          <li>Send exactly <span className="text-[#FFCC00]">{formatSOL(amount, 4)} SOL</span></li>
          <li>Wait for confirmation (usually 10-30 seconds)</li>
        </ol>
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        disabled={isDetecting}
        className="w-full py-4 rounded-xl border border-white/20 text-white/60 font-inter text-[14px] hover:bg-white/5 transition-all disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
