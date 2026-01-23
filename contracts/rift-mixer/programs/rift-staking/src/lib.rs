// RIFT Staking Program - Solana Smart Contract
// Original implementation by RIFT Protocol Team
// 
// This program handles staking SOL to earn rewards from protocol fees
// Features: Tiered staking, relayer registration, governance voting

use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("RiFTStake1111111111111111111111111111111");

// ============================================
// CONSTANTS
// ============================================

pub const STAKE_SEED: &[u8] = b"stake";
pub const POOL_SEED: &[u8] = b"staking_pool";
pub const RELAYER_SEED: &[u8] = b"relayer";

// Staking parameters
pub const MIN_STAKE_AMOUNT: u64 = 100_000_000; // 0.1 SOL (lamports)
pub const MAX_STAKE_AMOUNT: u64 = 1_000_000_000_000; // 1000 SOL
pub const LOCKUP_DURATION: i64 = 3 * 24 * 60 * 60; // 3 days in seconds
pub const DAILY_REWARD_RATE: u64 = 145; // 1.45% daily (in basis points)

// Tier thresholds (in lamports)
pub const BRONZE_THRESHOLD: u64 = 10_000_000_000; // 10 SOL
pub const SILVER_THRESHOLD: u64 = 50_000_000_000; // 50 SOL
pub const GOLD_THRESHOLD: u64 = 100_000_000_000; // 100 SOL
pub const PLATINUM_THRESHOLD: u64 = 500_000_000_000; // 500 SOL
pub const DIAMOND_THRESHOLD: u64 = 1_000_000_000_000; // 1000 SOL

// Relayer parameters
pub const MIN_RELAYER_STAKE: u64 = 100_000_000_000; // 100 SOL minimum to run relayer
pub const RELAYER_FEE_SHARE: u64 = 1000; // 10% in basis points
pub const SLASHING_RATE: u64 = 500; // 5% in basis points

// ============================================
// PROGRAM
// ============================================

#[program]
pub mod rift_staking {
    use super::*;

    /// Initialize the staking pool
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let pool = &mut ctx.accounts.staking_pool;
        pool.authority = ctx.accounts.authority.key();
        pool.total_staked = 0;
        pool.total_stakers = 0;
        pool.total_rewards_distributed = 0;
        pool.accumulated_fees = 0;
        pool.is_paused = false;
        pool.bump = ctx.bumps.staking_pool;
        
        emit!(PoolInitialized {
            authority: pool.authority,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Stake SOL to earn rewards
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.staking_pool.is_paused, StakingError::PoolPaused);
        require!(amount >= MIN_STAKE_AMOUNT, StakingError::AmountTooLow);
        require!(amount <= MAX_STAKE_AMOUNT, StakingError::AmountTooHigh);

        let clock = Clock::get()?;
        let stake_account = &mut ctx.accounts.stake_account;
        let pool = &mut ctx.accounts.staking_pool;

        // Check if this is a new stake or adding to existing
        let is_new_stake = stake_account.amount == 0;

        // Transfer SOL to pool vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.staker.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        // Update stake account
        stake_account.owner = ctx.accounts.staker.key();
        stake_account.amount += amount;
        stake_account.staked_at = clock.unix_timestamp;
        stake_account.lockup_ends_at = clock.unix_timestamp + LOCKUP_DURATION;
        stake_account.last_claim_at = clock.unix_timestamp;
        stake_account.total_claimed = 0;
        stake_account.tier = calculate_tier(stake_account.amount);
        stake_account.is_relayer = false;
        stake_account.bump = ctx.bumps.stake_account;

        // Update pool stats
        pool.total_staked += amount;
        if is_new_stake {
            pool.total_stakers += 1;
        }

        emit!(StakeCreated {
            staker: ctx.accounts.staker.key(),
            amount,
            tier: stake_account.tier,
            lockup_ends_at: stake_account.lockup_ends_at,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Claim accumulated rewards
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        require!(!ctx.accounts.staking_pool.is_paused, StakingError::PoolPaused);

        let clock = Clock::get()?;
        let stake_account = &mut ctx.accounts.stake_account;
        let pool = &mut ctx.accounts.staking_pool;

        // Calculate rewards
        let rewards = calculate_rewards(stake_account, clock.unix_timestamp)?;
        require!(rewards > 0, StakingError::NoRewardsToClaim);

        // Transfer rewards from vault
        let pool_seeds = &[
            POOL_SEED,
            &[pool.bump],
        ];
        let signer_seeds = &[&pool_seeds[..]];

        let transfer_amount = std::cmp::min(rewards, ctx.accounts.pool_vault.lamports());
        
        **ctx.accounts.pool_vault.try_borrow_mut_lamports()? -= transfer_amount;
        **ctx.accounts.staker.try_borrow_mut_lamports()? += transfer_amount;

        // Update state
        stake_account.last_claim_at = clock.unix_timestamp;
        stake_account.total_claimed += transfer_amount;
        pool.total_rewards_distributed += transfer_amount;

        emit!(RewardsClaimed {
            staker: ctx.accounts.staker.key(),
            amount: transfer_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Unstake SOL (after lockup period)
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let clock = Clock::get()?;
        let stake_account = &mut ctx.accounts.stake_account;
        let pool = &mut ctx.accounts.staking_pool;

        require!(
            clock.unix_timestamp >= stake_account.lockup_ends_at,
            StakingError::StillLocked
        );

        // Calculate and claim any remaining rewards first
        let rewards = calculate_rewards(stake_account, clock.unix_timestamp)?;
        let total_payout = stake_account.amount + rewards;

        // Transfer from vault
        let transfer_amount = std::cmp::min(total_payout, ctx.accounts.pool_vault.lamports());
        
        **ctx.accounts.pool_vault.try_borrow_mut_lamports()? -= transfer_amount;
        **ctx.accounts.staker.try_borrow_mut_lamports()? += transfer_amount;

        // Update pool stats
        pool.total_staked -= stake_account.amount;
        pool.total_stakers -= 1;
        pool.total_rewards_distributed += rewards;

        emit!(Unstaked {
            staker: ctx.accounts.staker.key(),
            principal: stake_account.amount,
            rewards,
            timestamp: clock.unix_timestamp,
        });

        // Close stake account
        stake_account.amount = 0;

        Ok(())
    }

    /// Register as a relayer (requires Gold tier or higher)
    pub fn register_relayer(ctx: Context<RegisterRelayer>, fee: u64) -> Result<()> {
        let stake_account = &ctx.accounts.stake_account;
        
        require!(
            stake_account.amount >= MIN_RELAYER_STAKE,
            StakingError::InsufficientStakeForRelayer
        );
        require!(fee <= 1000, StakingError::FeeTooHigh); // Max 10%

        let clock = Clock::get()?;
        let relayer = &mut ctx.accounts.relayer_account;

        relayer.owner = ctx.accounts.staker.key();
        relayer.stake_account = ctx.accounts.stake_account.key();
        relayer.fee = fee;
        relayer.successful_relays = 0;
        relayer.failed_relays = 0;
        relayer.reputation = 100; // Start with perfect reputation
        relayer.is_active = true;
        relayer.registered_at = clock.unix_timestamp;
        relayer.bump = ctx.bumps.relayer_account;

        // Update stake account
        let stake = &mut ctx.accounts.stake_account;
        stake.is_relayer = true;

        emit!(RelayerRegistered {
            relayer: ctx.accounts.staker.key(),
            fee,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Record successful relay (called by mixer program)
    pub fn record_relay(ctx: Context<RecordRelay>, success: bool) -> Result<()> {
        let relayer = &mut ctx.accounts.relayer_account;
        
        if success {
            relayer.successful_relays += 1;
            // Increase reputation (max 100)
            if relayer.reputation < 100 {
                relayer.reputation = std::cmp::min(100, relayer.reputation + 1);
            }
        } else {
            relayer.failed_relays += 1;
            // Decrease reputation
            relayer.reputation = relayer.reputation.saturating_sub(5);
        }

        emit!(RelayRecorded {
            relayer: relayer.owner,
            success,
            new_reputation: relayer.reputation,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Slash relayer for malicious behavior
    pub fn slash_relayer(ctx: Context<SlashRelayer>, reason: String) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let pool = &mut ctx.accounts.staking_pool;
        let relayer = &mut ctx.accounts.relayer_account;

        // Calculate slash amount (5% of stake)
        let slash_amount = stake_account.amount * SLASHING_RATE / 10000;

        // Transfer slashed amount to treasury
        **ctx.accounts.pool_vault.try_borrow_mut_lamports()? -= slash_amount;
        **ctx.accounts.treasury.try_borrow_mut_lamports()? += slash_amount;

        // Update state
        stake_account.amount -= slash_amount;
        relayer.is_active = false;
        relayer.reputation = 0;

        emit!(RelayerSlashed {
            relayer: relayer.owner,
            amount: slash_amount,
            reason,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Deposit protocol fees (called by mixer program)
    pub fn deposit_fees(ctx: Context<DepositFees>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.staking_pool;
        
        // Transfer fees to pool vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        pool.accumulated_fees += amount;

        emit!(FeesDeposited {
            amount,
            total_fees: pool.accumulated_fees,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Get stake info (view function)
    pub fn get_stake_info(ctx: Context<GetStakeInfo>) -> Result<StakeInfo> {
        let stake_account = &ctx.accounts.stake_account;
        let clock = Clock::get()?;
        
        let pending_rewards = calculate_rewards(stake_account, clock.unix_timestamp)?;
        
        Ok(StakeInfo {
            owner: stake_account.owner,
            amount: stake_account.amount,
            tier: stake_account.tier,
            pending_rewards,
            total_claimed: stake_account.total_claimed,
            lockup_ends_at: stake_account.lockup_ends_at,
            is_relayer: stake_account.is_relayer,
        })
    }
}

// ============================================
// ACCOUNTS
// ============================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::LEN,
        seeds = [POOL_SEED],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    /// CHECK: Pool vault PDA
    #[account(
        seeds = [b"vault"],
        bump
    )]
    pub pool_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    #[account(
        init_if_needed,
        payer = staker,
        space = 8 + StakeAccount::LEN,
        seeds = [STAKE_SEED, staker.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    /// CHECK: Pool vault PDA
    #[account(mut)]
    pub pool_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub staker: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    #[account(
        mut,
        seeds = [STAKE_SEED, staker.key().as_ref()],
        bump = stake_account.bump,
        has_one = owner @ StakingError::NotStakeOwner
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    /// CHECK: Pool vault PDA
    #[account(mut)]
    pub pool_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub staker: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    #[account(
        mut,
        seeds = [STAKE_SEED, staker.key().as_ref()],
        bump = stake_account.bump,
        has_one = owner @ StakingError::NotStakeOwner
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    /// CHECK: Pool vault PDA
    #[account(mut)]
    pub pool_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub staker: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterRelayer<'info> {
    #[account(
        mut,
        seeds = [STAKE_SEED, staker.key().as_ref()],
        bump = stake_account.bump,
        has_one = owner @ StakingError::NotStakeOwner
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    #[account(
        init,
        payer = staker,
        space = 8 + RelayerAccount::LEN,
        seeds = [RELAYER_SEED, staker.key().as_ref()],
        bump
    )]
    pub relayer_account: Account<'info, RelayerAccount>,
    
    #[account(mut)]
    pub staker: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordRelay<'info> {
    #[account(
        mut,
        seeds = [RELAYER_SEED, relayer_account.owner.as_ref()],
        bump = relayer_account.bump
    )]
    pub relayer_account: Account<'info, RelayerAccount>,
    
    /// CHECK: Mixer program authority
    pub mixer_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SlashRelayer<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump = staking_pool.bump,
        has_one = authority @ StakingError::Unauthorized
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    #[account(
        mut,
        seeds = [STAKE_SEED, relayer_account.owner.as_ref()],
        bump = stake_account.bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    #[account(
        mut,
        seeds = [RELAYER_SEED, relayer_account.owner.as_ref()],
        bump = relayer_account.bump
    )]
    pub relayer_account: Account<'info, RelayerAccount>,
    
    /// CHECK: Pool vault PDA
    #[account(mut)]
    pub pool_vault: AccountInfo<'info>,
    
    /// CHECK: Treasury account
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DepositFees<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    /// CHECK: Pool vault PDA
    #[account(mut)]
    pub pool_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub depositor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetStakeInfo<'info> {
    #[account(
        seeds = [STAKE_SEED, staker.key().as_ref()],
        bump = stake_account.bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    /// CHECK: Staker pubkey for PDA derivation
    pub staker: AccountInfo<'info>,
}

// ============================================
// STATE
// ============================================

#[account]
pub struct StakingPool {
    pub authority: Pubkey,
    pub total_staked: u64,
    pub total_stakers: u64,
    pub total_rewards_distributed: u64,
    pub accumulated_fees: u64,
    pub is_paused: bool,
    pub bump: u8,
}

impl StakingPool {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub amount: u64,
    pub staked_at: i64,
    pub lockup_ends_at: i64,
    pub last_claim_at: i64,
    pub total_claimed: u64,
    pub tier: StakingTier,
    pub is_relayer: bool,
    pub bump: u8,
}

impl StakeAccount {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 1;
}

#[account]
pub struct RelayerAccount {
    pub owner: Pubkey,
    pub stake_account: Pubkey,
    pub fee: u64,
    pub successful_relays: u64,
    pub failed_relays: u64,
    pub reputation: u8,
    pub is_active: bool,
    pub registered_at: i64,
    pub bump: u8,
}

impl RelayerAccount {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 1 + 1 + 8 + 1;
}

// ============================================
// TYPES
// ============================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum StakingTier {
    None,
    Bronze,
    Silver,
    Gold,
    Platinum,
    Diamond,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct StakeInfo {
    pub owner: Pubkey,
    pub amount: u64,
    pub tier: StakingTier,
    pub pending_rewards: u64,
    pub total_claimed: u64,
    pub lockup_ends_at: i64,
    pub is_relayer: bool,
}

// ============================================
// EVENTS
// ============================================

#[event]
pub struct PoolInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct StakeCreated {
    pub staker: Pubkey,
    pub amount: u64,
    pub tier: StakingTier,
    pub lockup_ends_at: i64,
    pub timestamp: i64,
}

#[event]
pub struct RewardsClaimed {
    pub staker: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct Unstaked {
    pub staker: Pubkey,
    pub principal: u64,
    pub rewards: u64,
    pub timestamp: i64,
}

#[event]
pub struct RelayerRegistered {
    pub relayer: Pubkey,
    pub fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct RelayRecorded {
    pub relayer: Pubkey,
    pub success: bool,
    pub new_reputation: u8,
    pub timestamp: i64,
}

#[event]
pub struct RelayerSlashed {
    pub relayer: Pubkey,
    pub amount: u64,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct FeesDeposited {
    pub amount: u64,
    pub total_fees: u64,
    pub timestamp: i64,
}

// ============================================
// ERRORS
// ============================================

#[error_code]
pub enum StakingError {
    #[msg("Pool is currently paused")]
    PoolPaused,
    #[msg("Stake amount below minimum")]
    AmountTooLow,
    #[msg("Stake amount above maximum")]
    AmountTooHigh,
    #[msg("Stake is still in lockup period")]
    StillLocked,
    #[msg("No rewards available to claim")]
    NoRewardsToClaim,
    #[msg("Not the stake owner")]
    NotStakeOwner,
    #[msg("Insufficient stake to run relayer")]
    InsufficientStakeForRelayer,
    #[msg("Relayer fee too high")]
    FeeTooHigh,
    #[msg("Unauthorized")]
    Unauthorized,
}

// ============================================
// HELPER FUNCTIONS
// ============================================

fn calculate_tier(amount: u64) -> StakingTier {
    if amount >= DIAMOND_THRESHOLD {
        StakingTier::Diamond
    } else if amount >= PLATINUM_THRESHOLD {
        StakingTier::Platinum
    } else if amount >= GOLD_THRESHOLD {
        StakingTier::Gold
    } else if amount >= SILVER_THRESHOLD {
        StakingTier::Silver
    } else if amount >= BRONZE_THRESHOLD {
        StakingTier::Bronze
    } else {
        StakingTier::None
    }
}

fn get_tier_multiplier(tier: StakingTier) -> u64 {
    match tier {
        StakingTier::None => 100,      // 1.0x
        StakingTier::Bronze => 100,    // 1.0x
        StakingTier::Silver => 125,    // 1.25x
        StakingTier::Gold => 150,      // 1.5x
        StakingTier::Platinum => 200,  // 2.0x
        StakingTier::Diamond => 250,   // 2.5x
    }
}

fn calculate_rewards(stake: &StakeAccount, current_time: i64) -> Result<u64> {
    if stake.amount == 0 {
        return Ok(0);
    }

    let seconds_staked = (current_time - stake.last_claim_at) as u64;
    let days_staked = seconds_staked / 86400; // Seconds per day
    
    if days_staked == 0 {
        return Ok(0);
    }

    // Base rewards: principal * daily_rate * days
    let base_rewards = stake.amount
        .checked_mul(DAILY_REWARD_RATE)
        .ok_or(StakingError::AmountTooHigh)?
        .checked_mul(days_staked)
        .ok_or(StakingError::AmountTooHigh)?
        .checked_div(10000)
        .ok_or(StakingError::AmountTooHigh)?;

    // Apply tier multiplier
    let multiplier = get_tier_multiplier(stake.tier);
    let total_rewards = base_rewards
        .checked_mul(multiplier)
        .ok_or(StakingError::AmountTooHigh)?
        .checked_div(100)
        .ok_or(StakingError::AmountTooHigh)?;

    Ok(total_rewards)
}
