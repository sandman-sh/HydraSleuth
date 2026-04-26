<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/radar.svg" alt="HydraSleuth Logo" width="120" />

  # HydraSleuth

  **Autonomous AI Agent Swarm for Blockchain Digital Forensics on Solana.** <br />
  Powered by *MagicBlock Private Ephemeral Rollups*, *TokenRouter AI*, and secure agent-to-agent incentives.

  <p align="center">
    <img src="https://img.shields.io/badge/Solana-Devnet-14F195?style=flat-square&logo=solana&logoColor=white" alt="Solana Devnet" />
    <img src="https://img.shields.io/badge/MagicBlock-Private%20Rollups-22ff88?style=flat-square" alt="MagicBlock" />
    <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/AI-Qwen%20122B-6366f1?style=flat-square" alt="AI Model" />
    <img src="https://img.shields.io/badge/Rust-Cargo-B7410E?style=flat-square&logo=rust&logoColor=white" alt="Rust" />
  </p>
</div>

---

## 📖 Overview

HydraSleuth is a **production-grade, autonomous AI agent swarm** purpose-built for blockchain digital forensics and investigation on Solana. It enables professional-level investigative workflows by combining on-chain data analysis with LLM-powered reasoning inside privacy-preserving MagicBlock Private Ephemeral Rollups.

Users submit an investigation case, such as:
- 🔍 **Investigate wallet `XYZ`** for possible wash trading or sybil behavior.
- 📉 **Analyze token `ABC`** for rug-pull risk (mint/freeze authority, metadata mutability).
- 🛡️ **Check program PDA** for suspicious upgradeability or delegation anomalies.

---

## ✨ Features

### 🤖 Autonomous AI Agent Swarm
Four specialized AI agents collaborate autonomously via encrypted handoffs:

| Agent | Role | Specialization |
|-------|------|---------------|
| **Lead Investigator** | Orchestrator & Synthesizer | Case decomposition, risk scoring (0-100), and final cyber-security summary |
| **Flow Tracer** | Fund Movement Analyst | Helius transaction graph analysis, transfer bursts, counterparty mapping, round-trip detection |
| **Metadata Sleuth** | Authority & Config Reviewer | Mint/freeze authority status, metadata mutability, wallet balance analysis, burner detection |
| **Pattern Detector** | Behavioral Anomaly Engine | Wash trading, sybil rings, liquidity theater, honeypot behavior, cross-agent signal fusion |

All agents are powered by the **Qwen 3.5-122B** LLM via the [TokenRouter API](https://www.tokenrouter.com/docs).

### 🔒 MagicBlock Private Ephemeral Rollups
- **Encrypted Agent Handoffs:** All inter-agent chain-of-thought stays inside the Private Ephemeral Rollup via AES-GCM encryption.
- **Private Micropayments:** Agents are autonomously rewarded in lamports based on contribution quality through hidden payment routes.
- **L1 Sanitized Settlement:** Only the final sanitized summary, risk score, and attestation hash are settled to Solana L1.

### 🔎 Deep On-Chain Intelligence
- **Live Wallet Balance Checking** — Real-time SOL balance retrieval for burner wallet detection.
- **SPL Token Metadata Extraction** — Mint authority, freeze authority, mutability, and update authority analysis via Metaplex.
- **Program Account Inspection** — Executable flag, BPF loader ownership, and data length analysis.
- **Transaction Graph Analysis** — Recent signature enumeration, counterparty spread, and rapid round-trip detection via Helius RPC.

### 🎨 Enterprise-Grade Forensic Dashboard
- **Full-Screen Agent Deployment Overlay** — Cinematic loading experience powered by Framer Motion with live step tracking.
- **Swarm Intelligence Bubble Chart** — Interactive Recharts ScatterChart plotting Severity vs. Impact for all forensic signals.
- **Forensic Evidence Signal Cards** — Color-coded severity badges (HIGH/MEDIUM/LOW) with AI-cited evidence for every signal.
- **Confidence Scores & Source Tags** — Per-agent confidence percentages and data provenance tags (#helius, #metaplex, #ai-analyzed).
- **Private Rollup Transparency Log** — Full session URI, PDA seeds, encrypted handoff records, and micropayment signatures.
- **1-Click PDF Export** — Dark-mode-preserving print stylesheet for professional forensic briefs.

### 💾 Browser-Based Persistence
- Investigation reports are persisted in **localStorage** for instant access across sessions.
- No external database dependency — the platform works fully self-contained in the browser.

### 🛡️ Resilient Fail-Soft Architecture
- Invalid addresses, empty wallets, and API failures produce structured forensic signals instead of crashes.
- Rate-limited RPC calls are transparently noted in the report rather than blocking the investigation.
- All agents return `AgentContribution` objects with error context, never unhandled exceptions.

---

## 🏗️ Monorepo Layout

```text
apps/
  frontend/                  # Next.js 14 case submission + forensic report UI
packages/
  agents/                    # AI agent swarm: Lead, FlowTracer, MetadataSleuth, PatternDetector
  magicblock-integration/    # PER session, dual connections, encryption, payments
  shared/                    # Cross-package types, helpers, and constants
programs/
  hydra_sleuth/              # Anchor-compatible Solana program (L1 entrypoint)
vendor/
  ephemeral-rollups-sdk/     # Local compatibility patch for cargo check
```

---

## ⚙️ Architecture

### 1. Solana L1 Entrypoint
`programs/hydra_sleuth/src/lib.rs` handles verifiable data execution on Solana:
- `initialize_treasury` | `submit_case` | `mark_case_investigating`
- `settle_report` | `delegate_case_state` | `commit_case_state` | `undelegate_case_state`
> Treasury and case records are stored as PDAs so HydraSleuth maintains a pristine L1 audit trail.

### 2. MagicBlock Private Execution Layer
`packages/magicblock-integration` handles the heavy lifting of execution privacy:
- 🔀 Dual base-layer and ephemeral connections.
- 📜 `PrivateRollupSession` for per-case orchestration.
- 🔐 AES-GCM encrypted handoff envelopes.
- 💳 Private payments against `payments.magicblock.app`.
- 🏷️ Network presets aligned to MagicBlock's documented public devnet.

### 3. Agent Swarm
`packages/agents` consists of highly specialized AI models powered by `qwen/qwen3.5-122b-a10b`:
- 🕵️ **Lead Investigator Agent**: Orchestrates tasks and produces a 4-6 sentence professional cyber-security summary.
- 🌊 **Flow Tracer Agent**: Tracks fund movements via Helius transaction history and detects wash trading patterns.
- 🖼️ **Metadata Sleuth Agent**: Analyzes Metaplex metadata, token authorities, wallet balances, and burner wallet signatures.
- 🔍 **Pattern Detector Agent**: Fuses multi-agent signals to detect sybil rings, liquidity theater, and rug-pull setups.

### 4. Frontend Interface
`apps/frontend` is a **Next.js 14 application** offering:
- Immersive full-screen agent deployment animation.
- Interactive Swarm Intelligence bubble chart.
- Detailed forensic evidence signal cards with severity badges.
- Private rollup transparency log with handoffs and micropayments.
- 1-click PDF export preserving dark-mode styling.
- Browser localStorage persistence for investigation history.

---

## 🚀 Local Setup

### Prerequisites
- Node `20+`
- *(Optional)*: Rust/Cargo and Anchor CLI for `anchor build`

### Environment
Create a `.env.local` file in the project root:

```env
TOKENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

Get a free TokenRouter API key at [tokenrouter.com](https://www.tokenrouter.com).

### Install Dependencies
```bash
npm install
```

### Run the Application
```bash
npm run dev
```
Then open `http://localhost:3000` in your browser.

---

## 🎥 Demo Script

1. Open the **HydraSleuth home page** at `http://localhost:3000`.
2. Click **"HydraSleuth App"** to enter the live dashboard.
3. **Submit** a wallet, token mint, or program address as a case.
4. Watch the **full-screen agent deployment animation** as the AI swarm processes the investigation.
5. On the **case detail page**, observe:
   - 🛡️ Risk Score with color-coded verdict badge
   - 📊 Interactive Swarm Intelligence bubble chart
   - 🔬 Forensic evidence signals with severity badges and AI-cited evidence
   - 🔒 Encrypted handoff records from the Private Rollup
   - 💸 Private micropayment signatures for agent rewards
   - 📄 Sanitized L1 settlement summary with attestation hash
6. Click **"Export PDF"** to download a professional forensic brief.
7. **Highlight:** The entire agent collaboration ran inside a MagicBlock Private Ephemeral Rollup — only sanitized data was settled to Solana L1.

---

## ✅ Verifying the Project

```bash
npm run build
```

---

## 📚 References
- [MagicBlock Ephemeral Rollups Quickstart](https://docs.magicblock.gg/pages/ephemeral-rollups-ers/how-to-guide/quickstart)
- [Private Payments API](https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/how-to-guide/private-spl-token-api)
- [Private PER Access Control](https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/how-to-guide/access-control)
- [TokenRouter API Docs](https://www.tokenrouter.com/docs)

---

<div align="center">
  <sub>Powered by Solana, MagicBlock, and TokenRouter AI</sub>
</div>
