use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};

declare_id!("BQ4eThhvKuqZH7taHwnBQB7VQPyei1d8TAbyByZ4ZJhp");

const INVESTIGATION_TYPE_MAX_LEN: usize = 32;
const CASE_ID_MAX_LEN: usize = 64;
const SUBJECT_MAX_LEN: usize = 64;
const SESSION_URI_MAX_LEN: usize = 128;
const SUMMARY_MAX_LEN: usize = 280;
const ATTESTATION_HASH_MAX_LEN: usize = 96;

#[ephemeral]
#[program]
pub mod hydra_sleuth {
    use super::*;

    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        treasury_mint: Pubkey,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.authority = ctx.accounts.authority.key();
        treasury.treasury_mint = treasury_mint;
        treasury.treasury_bump = ctx.bumps.treasury;
        treasury.total_cases = 0;
        treasury.settled_cases = 0;
        Ok(())
    }

    pub fn submit_case(
        ctx: Context<SubmitCase>,
        case_id: String,
        investigation_type: String,
        subject: String,
        private_session_uri: String,
    ) -> Result<()> {
        require!(
            investigation_type.len() <= INVESTIGATION_TYPE_MAX_LEN,
            HydraError::StringTooLong
        );
        require!(case_id.len() <= CASE_ID_MAX_LEN, HydraError::StringTooLong);
        require!(subject.len() <= SUBJECT_MAX_LEN, HydraError::StringTooLong);
        require!(
            private_session_uri.len() <= SESSION_URI_MAX_LEN,
            HydraError::StringTooLong
        );

        let now = Clock::get()?.unix_timestamp;
        let treasury = &mut ctx.accounts.treasury;
        let case_record = &mut ctx.accounts.case_record;

        treasury.total_cases = treasury
            .total_cases
            .checked_add(1)
            .ok_or(HydraError::MathOverflow)?;

        case_record.requester = ctx.accounts.requester.key();
        case_record.treasury = treasury.key();
        case_record.risk_score = 0;
        case_record.status = CaseStatus::Submitted as u8;
        case_record.bump = ctx.bumps.case_record;
        case_record.created_at = now;
        case_record.updated_at = now;
        case_record.investigation_type = investigation_type;
        case_record.case_id = case_id;
        case_record.subject = subject;
        case_record.private_session_uri = private_session_uri;
        case_record.sanitized_summary = String::new();
        case_record.attestation_hash = String::new();

        Ok(())
    }

    pub fn mark_case_investigating(ctx: Context<MarkCaseInvestigating>) -> Result<()> {
        let case_record = &mut ctx.accounts.case_record;
        case_record.status = CaseStatus::Investigating as u8;
        case_record.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn settle_report(
        ctx: Context<SettleReport>,
        sanitized_summary: String,
        attestation_hash: String,
        risk_score: u8,
    ) -> Result<()> {
        require!(
            sanitized_summary.len() <= SUMMARY_MAX_LEN,
            HydraError::StringTooLong
        );
        require!(
            attestation_hash.len() <= ATTESTATION_HASH_MAX_LEN,
            HydraError::StringTooLong
        );

        let treasury = &mut ctx.accounts.treasury;
        let case_record = &mut ctx.accounts.case_record;

        treasury.settled_cases = treasury
            .settled_cases
            .checked_add(1)
            .ok_or(HydraError::MathOverflow)?;

        case_record.sanitized_summary = sanitized_summary;
        case_record.attestation_hash = attestation_hash;
        case_record.risk_score = risk_score;
        case_record.status = CaseStatus::Settled as u8;
        case_record.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn delegate_case_state(ctx: Context<DelegateCaseState>, case_id: String) -> Result<()> {
        ctx.accounts.delegate_case_record(
            &ctx.accounts.payer,
            &[b"case", case_id.as_bytes()],
            DelegateConfig::default(),
        )?;
        Ok(())
    }

    pub fn commit_case_state(ctx: Context<CommitCaseState>) -> Result<()> {
        commit_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.case_record.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }

    pub fn undelegate_case_state(ctx: Context<UndelegateCaseState>) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.case_record.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Eq, PartialEq)]
pub enum CaseStatus {
    Submitted = 0,
    Investigating = 1,
    Settled = 2,
}

#[account]
#[derive(InitSpace)]
pub struct TreasuryConfig {
    pub authority: Pubkey,
    pub treasury_mint: Pubkey,
    pub treasury_bump: u8,
    pub total_cases: u64,
    pub settled_cases: u64,
}

#[account]
#[derive(InitSpace)]
pub struct CaseRecord {
    pub requester: Pubkey,
    pub treasury: Pubkey,
    pub risk_score: u8,
    pub status: u8,
    pub bump: u8,
    pub created_at: i64,
    pub updated_at: i64,
    #[max_len(INVESTIGATION_TYPE_MAX_LEN)]
    pub investigation_type: String,
    #[max_len(CASE_ID_MAX_LEN)]
    pub case_id: String,
    #[max_len(SUBJECT_MAX_LEN)]
    pub subject: String,
    #[max_len(SESSION_URI_MAX_LEN)]
    pub private_session_uri: String,
    #[max_len(SUMMARY_MAX_LEN)]
    pub sanitized_summary: String,
    #[max_len(ATTESTATION_HASH_MAX_LEN)]
    pub attestation_hash: String,
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + TreasuryConfig::INIT_SPACE,
        seeds = [b"treasury", authority.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, TreasuryConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct SubmitCase<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,
    #[account(mut)]
    pub treasury: Account<'info, TreasuryConfig>,
    #[account(
        init,
        payer = requester,
        space = 8 + CaseRecord::INIT_SPACE,
        seeds = [b"case", case_id.as_bytes()],
        bump
    )]
    pub case_record: Account<'info, CaseRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MarkCaseInvestigating<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, has_one = treasury)]
    pub case_record: Account<'info, CaseRecord>,
    pub treasury: Account<'info, TreasuryConfig>,
}

#[derive(Accounts)]
pub struct SettleReport<'info> {
    #[account(mut, address = treasury.authority)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub treasury: Account<'info, TreasuryConfig>,
    #[account(mut, has_one = treasury)]
    pub case_record: Account<'info, CaseRecord>,
}

#[delegate]
#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct DelegateCaseState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Optional validator override for a specific MagicBlock endpoint.
    pub validator: Option<AccountInfo<'info>>,
    /// CHECK: Checked by the delegation program.
    #[account(mut, del, seeds = [b"case", case_id.as_bytes()], bump)]
    pub case_record: AccountInfo<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitCaseState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Delegated case state is committed through the Magic program.
    #[account(mut)]
    pub case_record: AccountInfo<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct UndelegateCaseState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Delegated case state is undelegated through the Magic program.
    #[account(mut)]
    pub case_record: AccountInfo<'info>,
}

#[error_code]
pub enum HydraError {
    #[msg("One of the provided strings exceeds the allowed size.")]
    StringTooLong,
    #[msg("A numeric calculation overflowed.")]
    MathOverflow,
}
