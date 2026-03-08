# Real-Time Home Exercise Monitoring App

An intelligent, browser-based web application that leverages **TensorFlow.js** and the **MoveNet** model to monitor home exercises in real-time. It validates exercise form, counts repetitions via joint angles, and provides an interactive Voice Assistant to guide users throughout their workout!

## 🚀 Key Features

*   **Real-Time Pose Detection**: Uses the `@tensorflow-models/pose-detection` MoveNet Thunder model for high-accuracy keypoint tracking locally in the browser.
*   **Automatic Repetition Counting**: Dynamically calculates key joint angles using trigonometry (e.g., shoulders, elbows, wrists, hips, knees). It employs an Up/Down state machine to count exercise repetitions robustly.
*   **Supported Exercises**:
    *   Left Bicep Curl
    *   Right Bicep Curl
    *   Push Ups
    *   Knee Squats
*   **Interactive Visual UI**:
    *   Highlights the human keypoints with real-time skeleton strokes and nodes.
    *   Draws a dynamic arc displaying the measured real-time angle of the relevant operating joint.
    *   Embeds visual reference animations (GIFs) and instructions.
*   **Voice Assistant Integration**: Reads out instructions ("You are in the up position.", "Good Job! Total repetitions: 5. Keep going.") using the browser's native `SpeechSynthesis API`.
*   **Backend Integration**: Connects to a FastAPI backend endpoint asynchronously to fetch details and validate Auth/Access Tokens dynamically.

## 🛠️ Tech Stack

*   **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (v4+)
*   **Build Tool**: Vite (v7+)
*   **Machine Learning**: TensorFlow.js (`@tensorflow/tfjs`, `@tensorflow-models/pose-detection`) WebGL Backend
*   **Authentication Validation**: `js-cookie` (Validating against FastAPI backend)

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Exercise-Monitoring-with-TFjs.git
   cd Exercise-Monitoring-with-TFjs
   ```

2. **Install Dependencies:**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm start
   ```

4. **Access the App:**
   Open your browser and navigate to `http://localhost:5173/`.

> [!IMPORTANT]
> **HOW TO BYPASS THE LOGIN SCREEN FOR LOCAL FRONTEND TESTING**
> 
> By default, the app expects a backend to authenticate users and will redirect you to `login.html`. If you are testing the frontend in isolation without the FastAPI backend running, you **must** manually set a dummy authentication cookie to access the main dashboard:
> 
> 1. Open your browser's Developer Tools (Press `Ctrl + Shift + I` or `F12` on Windows/Linux, or `Cmd + Option + I` on Mac).
> 2. Navigate to the **Console** tab.
> 3. Paste the following JavaScript command and press **Enter**:
>    `document.cookie = "accessToken=dummy; path=/";`
> 4. Change your URL back to `http://localhost:5173/` and hit Enter to access the camera dashboard!

## 🤝 Contribution Guidelines

We welcome contributions to make this project even better!

1.  **Fork the repository** on GitHub.
2.  **Create a new branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit your changes** (`git commit -m 'Add some AmazingFeature'`).
4.  **Push to the branch** (`git push origin feature/AmazingFeature`).
5.  **Open a Pull Request**.

### Areas for Contribution:
*   Adding new models or exercises (e.g., lunges, jumping jacks).
*   Enhancing the UI/UX with additional dynamic graphs.
*   Improving performance on lower-end devices by integrating `MoveNet Lightning`.
*   Writing comprehensive test suites.

## 📝 License
This project is licensed under the ISC License.
