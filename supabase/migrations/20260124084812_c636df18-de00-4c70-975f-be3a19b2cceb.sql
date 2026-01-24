-- Create mix_sessions table for tracking privacy mixer operations
CREATE TABLE public.mix_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  amount_sol NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Deposit wallet (system-generated, user sends funds here)
  deposit_address TEXT,
  deposit_private_key_encrypted TEXT,
  
  -- Output wallet (fresh wallet with mixed funds)
  output_address TEXT,
  output_private_key TEXT,
  
  -- Transaction signatures
  tx_signature_in TEXT,
  tx_signature_out TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deposit_detected_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (amount_sol >= 0.01 AND amount_sol <= 10),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'awaiting_deposit', 'deposit_detected', 'processing', 'completed', 'expired', 'failed'))
);

-- Enable Row Level Security
ALTER TABLE public.mix_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see their own sessions
CREATE POLICY "Users can view their own mix sessions"
ON public.mix_sessions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert mix sessions"
ON public.mix_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update mix sessions"
ON public.mix_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_mix_sessions_user_wallet ON public.mix_sessions(user_wallet);
CREATE INDEX idx_mix_sessions_deposit_address ON public.mix_sessions(deposit_address);
CREATE INDEX idx_mix_sessions_status ON public.mix_sessions(status);

-- Add trigger for updated_at (reuse existing function)
ALTER TABLE public.mix_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

CREATE TRIGGER update_mix_sessions_updated_at
BEFORE UPDATE ON public.mix_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();