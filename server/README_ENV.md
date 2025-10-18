# Environment Variables (local setup)

This project expects environment variables to be set in `server/.env` during local development.

Steps to set up your local environment variables safely:

1. Copy the example file:

   cp .env.example .env

2. Open `.env` and fill in real keys for providers you plan to use (e.g., `GOOGLE_AI_API_KEY`, `GROQ_API_KEY`, `HUGGINGFACE_API_KEY`). Do not commit `.env` to source control.

3. Ensure `.env` is included in your `.gitignore` (it should be by default in many templates):

   # Add this line to your .gitignore if it's not present
   /server/.env

Notes:
- Puter.js (https://js.puter.com/) can be used on the client (frontend) to access some Qwen models without an API key for demos. Do NOT load Puter.js on the server — it is intended for browser use.
- If you don't have an API key for a provider, leave the variable blank. The server will try fallbacks according to its routing logic.
- Never paste real secrets into public issues, PRs, or chats. If you accidentally commit a secret, rotate the key immediately.
