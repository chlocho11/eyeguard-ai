# eyeguard-ai
# Live Demo
https://eyeguard-b9df2.web.app

EyeGuard - AI-Powered Digital Eye Strain Monitoring System
-----------------------------------------------
EyeGuard AI is a web-based application that monitors real-time blink behavior using computer vision and generates personalized health recommendations using Google Gemini.
Aligned SDGs:
-SDG 3: Good Health and Well-being
-SDG 8: Decent Work and Economic Growth

## Project Documentation ##
---------------------------
System flow:
Webcam Input → MediaPipe Face Mesh → Blink Metric Calculation → Strain Detection Logic → Google Gemini → Alert Display → Firebase Hosting Deployment

## Technologies Used:
1. Frontend – React + Vite
Handles user interaction, camera access, monitoring interface, and alert display.

2. Computer Vision – MediaPipe Face Mesh
MediaPipe is used to detect facial landmarks directly in the browser. Eye landmark coordinates are extracted to calculate the Eye Aspect Ratio (EAR), which allows blink detection and prolonged eye openness monitoring.

3. AI Integration – Google Gemini (Google AI Technology)
Google Gemini is used as the core AI component. Instead of using static rule-based messages, structured blink metrics are sent to Gemini. Gemini generates personalized and contextual health recommendations based on strain patterns and user mode.

4. Cloud Deployment – Firebase Hosting (Google Developer Technology)
The web application is deployed using Firebase Hosting. Firebase provides secure, scalable, and globally accessible cloud infrastructure. 

## Explanation of Implementation:
The implementation focuses on real-time performance, personalization, and scalability.
First, the system performs a short calibration session to establish the user’s natural blink baseline. This baseline ensures that strain detection is personalized rather than using fixed global thresholds.
During monitoring, MediaPipe continuously tracks eye landmarks and calculates blink frequency and eye openness duration. These metrics are processed through a logic engine that determines whether abnormal strain patterns exist.
When strain is detected, only structured numerical data (not video) is sent to Google Gemini. Gemini then generates adaptive recommendations based on the severity of strain and selected user mode.
Alerts are displayed through popup notifications and optional sound cues. All processing of video data occurs locally in the browser to reduce latency and protect privacy.

## Innovation:
EyeGuard introduces several innovative aspects:
- It monitors physiological signals instead of relying on fixed time-based reminders.
- It establishes a personalized baseline calibration for each user.
- It integrates real-time computer vision with generative AI.
- It separates detection (MediaPipe) from reasoning (Gemini), improving modularity and scalability.
- It provides contextual coaching rather than repetitive static alerts.

## Challenges:
1. Blink Detection Instability
Lighting conditions affected landmark accuracy and blink detection.
Solution: Adjusted EAR thresholds and implemented smoothing logic to stabilize detection.

2. False Positive Alerts During Focus
Users were interrupted during deep concentration.
Solution: Improved strain logic by analyzing short time-window patterns instead of single-frame detection.

3. Real-Time Performance Constraints
Simultaneous video processing and AI requests caused slight delay.
Solution: Kept video processing fully local and sent only lightweight structured data to Gemini.

4. Calibration Usability
Initial calibration duration was too long.
Solution: Reduced to 5 minutes while maintaining stable baseline estimation.
--------------------------------------------------------

Setup Instructions:

Prerequisites:
- Node.js (v18 or above)
- npm installed
- Google Gemini API key
- Firebase CLI installed

Run Locally:
```bash
git clone https://github.com/chlocho11/eyeguard-ai.git
cd eyeguard-ai
npm install
npm run dev
```
Build and Deploy:
```bash
npm run build
firebase deploy
```

**
- Blink detection runs locally in the browser using MediaPipe.
- Only structured numerical strain data is sent to Google Gemini.
- The system is fully functional as a deployed web prototype.
- No raw video data is stored or transmitted.