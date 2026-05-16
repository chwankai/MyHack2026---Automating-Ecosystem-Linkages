<div align="center">

# NexusCore: Automating Ecosystem Linkages 🚀
*Built for MyHack 2026*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com)

</div>

NexusCore is an AI-native ecosystem management platform that transforms ad-hoc coordination into **programmable, reusable relationship entities**. By treating linkages as first-class objects, the platform enables innovation hubs to scale from dozens to thousands of strategic matches using autonomous AI agents.

## ✨ Key Features

### 🧠 Relationship Architect (AI Matchmaker)
*   **Autonomous Discovery**: Powered by **Gemini 1.5 Flash**, the system analyzes participant profiles and program contexts to recommend high-value matches.
*   **Strategic Justification**: Every link comes with a detailed AI-generated "Blueprint" explaining the synergy and expected outcomes.
*   **Propensity Scoring**: Real-time confidence analysis (0.00 - 1.00 scale) to prioritize the most promising connections.

### 🔗 Programmable Linkage Ledger
*   **Lifecycle Management**: Transition relationships from **Proposed** to **Active** to **Completed** or **Cancelled** with a unified workflow.
*   **Smart Filtering**: Advanced ledger views allowing administrators to pivot between all relationships or focus on specific propagation states.
*   **Sorted Chronology**: Always stay on top of the latest ecosystem activity with time-sorted relationship logs.

### 📈 AI Performance Synthesis
*   **Automated Evaluation**: When a relationship is completed, the AI analyzes the entire review history to generate a **Final Engagement Score**.
*   **Performance Synthesis**: Replaces manual exit interviews with a concise, AI-generated performance record.
*   **Engagement Ledger**: Every actor profile maintains a permanent history of past relationship performance, improving future matching.

### 📊 Operational Dashboard
*   **Network Connectivity**: A real-time health score calculated from the aggregate engagement levels across the entire ecosystem.
*   **Pending Linkages**: Track system bottlenecks by monitoring proposed and active linkages in one view.
*   **Node Topology**: High-level tracking of Companies, Mentors, Partners, and Providers.

## 🛠 Tech Stack
*   **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Motion (Framer), Lucide Icons
*   **Backend**: Firebase (Firestore, Auth)
*   **AI Engine**: Google Gen AI SDK (`gemini-1.5-flash`)
*   **Design**: Modern Dark-Mode & Glassmorphism aesthetics

## 🚀 Getting Started

### Prerequisites
*   Node.js v18+
*   Google Gemini API Key (from [AI Studio](https://aistudio.google.com/))

### Installation
1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/chwankai/NexusCore-Automating-Ecosystem-Linkages.git
    cd MyHack2026---Automating-Ecosystem-Linkages
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env.local` file and add your Gemini key:
    ```env
    GEMINI_API_KEY="your_api_key_here"
    APP_URL="your_app_url_here"
    ```
4.  **Firebase Config**:
    Ensure `firebase-applet-config.json` is present in the root directory (provided by the environment).

### Run Locally
```bash
npm run dev
```

### 💡 Pro Tip: Full Matrix Reset
Once running, go to the **Entity Library** tab and click **"Populate Initial Matrix"**. This will purge the database and inject a high-density, interconnected ecosystem of 12 actors and 3 programs to test all AI features immediately.

---

## 🔒 Security
*   **Owner-Based Access**: Multi-tenant security rules ensure participants can only be managed by their respective owners.
*   **Finalized Records**: Completed linkages are automatically locked to prevent post-completion data tampering.
