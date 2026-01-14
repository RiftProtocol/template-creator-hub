-- Stakes table to track all staking positions
CREATE TABLE public.stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  amount_sol DECIMAL(20, 9) NOT NULL CHECK (amount_sol > 0),
  staked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lockup_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '3 days'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unstaking', 'completed')),
  tx_signature TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reward claims table
CREATE TABLE public.reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id UUID NOT NULL REFERENCES public.stakes(id) ON DELETE CASCADE,
  amount_sol DECIMAL(20, 9) NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tx_signature TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Unstake requests table
CREATE TABLE public.unstake_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id UUID NOT NULL REFERENCES public.stakes(id) ON DELETE CASCADE,
  amount_sol DECIMAL(20, 9) NOT NULL,
  rewards_sol DECIMAL(20, 9) NOT NULL DEFAULT 0,
  recipient_wallet TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  tx_signature TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Enable Row Level Security
ALTER TABLE public.stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unstake_requests ENABLE ROW LEVEL SECURITY;

-- Stakes policies: Users can see their own stakes (by wallet address)
CREATE POLICY "Anyone can view stakes by wallet"
ON public.stakes FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert stakes"
ON public.stakes FOR INSERT
WITH CHECK (true);

-- Reward claims policies
CREATE POLICY "Anyone can view reward claims"
ON public.reward_claims FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert reward claims"
ON public.reward_claims FOR INSERT
WITH CHECK (true);

-- Unstake requests policies
CREATE POLICY "Anyone can view unstake requests"
ON public.unstake_requests FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert unstake requests"
ON public.unstake_requests FOR INSERT
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for stakes updated_at
CREATE TRIGGER update_stakes_updated_at
BEFORE UPDATE ON public.stakes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster wallet lookups
CREATE INDEX idx_stakes_user_wallet ON public.stakes(user_wallet);
CREATE INDEX idx_stakes_status ON public.stakes(status);
CREATE INDEX idx_unstake_requests_status ON public.unstake_requests(status);