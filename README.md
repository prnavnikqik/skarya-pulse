# ✦ Skarya Pulse

**Automated AI Standup Facilitator & Sprint Intelligence for Engineering Teams.**

Skarya Pulse is a high-agency AI agent designed to live within your engineering workflow. It replaces robotic, dry standups with dynamic, accountability-driven conversations. Pulse doesn't just ask "What did you do?"; it cross-references your promises with real-time board data, identifies blockers across the team, and helps you plan your day with precision.

---

## 🚀 Features

- **Dynamic Standup Protocol**: A strict 3-phase flow (Accountability, Team Health, Planning) that reconciles current board state with past promises.
- **Sprint Intelligence**: Real-time analysis of board health, overdue tasks, and deadline risks.
- **Accountability Reconciliation**: Pulls data from prior standups to ensure promises were kept.
- **Context-Aware Recommendations**: Suggests next tasks based on current sprint priority and workload.
- **Automatic Persistence**: Background extraction of standup summaries into structured format for team review.
- **Multi-Model Support**: Optimized for Groq (Llama 3.3/3.1), Anthropic (Claude 3.5/3.7), and OpenAI (GPT-4o).

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **AI Engine**: Vercel AI SDK, Groq SDK.
- **Database**: MongoDB (Mongoose).
- **Integrations**: Skarya API, Playwright (for auth automation).

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB instance (local or Atlas)
- API Keys: GROQ_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/prnavnikqik/skarya-pulse.git
   cd skarya-pulse
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root and add:
   ```env
   MONGODB_URI=your_mongodb_uri
   GROQ_API_KEY=your_key
   SKARYA_API_TOKEN=your_token
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:5656](http://localhost:5656) with your browser to see the result.

## 🏗️ Architecture

Skarya Pulse uses a layered agent architecture:

1. **Intent Layer**: Uses Llama 3.1-8B to rapidly categorize user input (Standup, Query, Task Management).
2. **Context Layer**: Dynamically builds sub-graphs of relevant tasks and historical chat context.
3. **Agent Engine**: Executes long-running reasoning loops, triggering tools/confirmation cards based on refined protocols.
4. **Extraction Layer**: Decoupled background process that distills structured standup records from chat transcripts.

## 📄 Documentation

Deep-dive into the design and specs:
- [System Architecture](./docs/02-SYSTEM-ARCHITECTURE.md)
- [Product Requirements](./docs/01-PRODUCT-REQUIREMENTS.md)
- [API Reference](./docs/03-SKARYA-API-REFERENCE.md)
- [LLM Design Patterns](./docs/04-LLM-DESIGN.md)

---

Developed with ✦ by the Skarya Team.
