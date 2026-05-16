<div align="center">

# NexusCore: Automating Ecosystem Linkages 🚀
*Built for MyHack 2026*

</div>

NexusCore is an AI-powered ecosystem management platform designed to automate, optimize, and track the relationships between various innovation actors (Companies, Mentors, Partners, and Service Providers) across different startup accelerator programs and ecosystems.

## ✨ Key Features

### 🏢 Entity Library (Participant Registry)
- Centralized management of ecosystem actors (Companies, Mentors, Partners, Service Providers).
- Dynamic, color-coded UI badges and icons for immediate visual identification of actor types.
- Rich profiles including sector, region, bio, and strategic resources.
- Safe deletion guards (prevents deletion of entities tied to active programs or linkages).

### 📋 Programme Blueprints
- Create and manage innovation programs, cohorts, and accelerators.
- **Categorized Entity Checklists:** Intuitively assign mixed-type entities to programs via an organized, grouped checklist interface directly within the Program Details Modal.
- **Export Topology:** Dynamically generate and download `.json` structural maps of your program blueprints and their assigned entities.

### 🧠 Relationship Architect (AI Matchmaker)
- Powered by Google's cutting-edge **Gemini 3 Flash Preview** AI.
- Select a Primary Node (Company) and a Target Persona to discover high-value strategic linkages.
- **Intelligent Context:** The AI specifically analyzes entities that share the *same program blueprint*, ensuring highly relevant recommendations.
- **Duplicate Prevention:** The system automatically filters out targets that already share an ongoing linkage with the company to conserve AI resources and prevent duplicate matches.
- Provides deep AI justifications and propensity scoring for every suggested connection.

### 🔗 Linkage Propagation Ledger
- A comprehensive ledger tracking the lifecycle of relationships (Proposed, Active, Completed, Rejected).
- Direct integration with the Matchmaker to authorize or reject AI-proposed links.
- Granular control with the ability to delete historical records to maintain a clean ecosystem state.

## 🛠 Tech Stack
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS (v4), Motion (Framer), Lucide React
- **Backend/Database:** Firebase (Firestore)
- **AI Integration:** Google Gen AI SDK (`@google/genai` utilizing `gemini-3-flash-preview`)

---

## 🚀 Run Locally

**Prerequisites:** Node.js v18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Set your Gemini API key and App URL in `.env.local`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   APP_URL="your_app_url"
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. **Populate Data:** Once running, log in (via Google Auth) and click "Populate Sample Programs" in the UI to generate initial test actors and programs.
