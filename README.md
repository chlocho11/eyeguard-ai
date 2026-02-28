# eyeguard-ai
KitaHack 2026 - Eye fatigue &amp; screen health assistant

Webapp: https://eyeguard-b9df2.web.app
Project Console: https://console.firebase.google.com/project/eyeguard-b9df2/overview

Setup Instructions:

Prerequisites:
- Node.js (v18 or above)
- npm installed
- Google Gemini API key
- Firebase CLI installed

1. Clone Repository
- git clone <https://github.com/chlocho11/eyeguard-ai.git>
- cd eyeguard-ai
2. Install Dependencies
- npm install
3. Run loacally
- npm run dev ---> http://localhost:5173
4. Build for Production
- npm run build
5. deploy to firebase
- firebase deploy

**
- Blink detection runs locally in the browser using MediaPipe.
- Only structured numerical strain data is sent to Google Gemini.
- The system is fully functional as a deployed web prototype.
- No raw video data is stored or transmitted.