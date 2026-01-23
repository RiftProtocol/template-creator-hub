-- Add column to track claimed rewards per stake
ALTER TABLE public.stakes 
ADD COLUMN claimed_rewards_sol numeric NOT NULL DEFAULT 0;

-- Add column to track last claim timestamp
ALTER TABLE public.stakes 
ADD COLUMN last_claimed_at timestamp with time zone;

-- Allow edge function (service role) to update stakes
CREATE POLICY "Service role can update stakes" 
ON public.stakes 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow edge function (service role) to update reward_claims
CREATE POLICY "Service role can update reward_claims" 
ON public.reward_claims 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow edge function (service role) to update unstake_requests
CREATE POLICY "Service role can update unstake_requests" 
ON public.unstake_requests 
FOR UPDATE 
USING (true)
WITH CHECK (true);