import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

let detector;
let selectedExercise;
let isMonitoring = false;
let repCount;
let exerciseStage;

const exercisePreviewMap = {
    "Left Bicep Curl": 'https://cdn.deepmindlabs.ai/images/rom/LeftandRightElbowFlexion.gif',
    "Right Bicep Curl": 'https://cdn.deepmindlabs.ai/images/rom/LeftandRightElbowFlexion.gif',
    "Push Up": 'https://cdn.deepmindlabs.ai/images/rom/LeftandRightElbowFlexion.gif',
    "Squat": 'assests/kneeSquat.gif',
}
const instructionsMap = {
    "Left Bicep Curl": ['Face the camera from left side of your body', 'Make sure that your left hand is fully visible', 'Click Start Monitoring'],
    "Right Bicep Curl": ['Face the camera from right side of your body', 'Make sure that your right hand is fully visible', 'Click Start Monitoring'],
    "Push Up": ['Face the camera from left side of your body', 'Make sure that your full body is visible', 'Click Start Monitoring'],
    "Squat": ['Face the camera from left side of your body', 'Make sure that your full body is visible', 'Click Start Monitoring'],
}

const exerciseDropdown = document.getElementById('exercise');
const startButton = document.getElementById('start-monitoring');
const stopButton = document.getElementById('stop-monitoring');
const exercisePreview = document.getElementById('exercise-preview');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const height = document.getElementById('height');
const heightAlert = document.getElementById('height-alert');
const instructionsContainer = document.getElementById('instructions-container');
const boardContainer = document.getElementById('board-container');

// Data Fetching through API
const fetchData = async () => {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/details/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        console.log("Data from FastAPI:", data);
    } catch (error) {
        console.error("Error:", error);
    }
};

fetchData();

// Event listener for the change exercise
exerciseDropdown.addEventListener('change', () => {
    selectedExercise = exerciseDropdown.value;
    exercisePreview.src = exercisePreviewMap[selectedExercise];
    startButton.disabled = false;
    stopButton.disabled = true;
    isMonitoring = false;
    boardContainer.innerHTML = "";
    console.log('on change');
    const pElement = document.createElement('p');
    pElement.innerText = 'See exercise preview and read the instructions carefully';
    boardContainer.appendChild(pElement);

    instructionsContainer.innerHTML = "";
    let instructions = instructionsMap[selectedExercise];
    instructions.forEach((instruction,index) => {
        const pElement = document.createElement('p');
        pElement.className = 'text-left';
        pElement.innerText = `${index + 1}) ${instruction}`;
        instructionsContainer.appendChild(pElement);
    });
});

// Initialize the camera stream when the page loads
async function initializeCamera() {
    heightAlert.style.display = "none";
    try {
        // Request webcam access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        console.log("Video stream tracks:", stream.getTracks());

        // Display live video feed in the video preview
        video.srcObject = stream;
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.zIndex = '1';
        video.style.display = "block";
        video.style.width = '100%';
        video.style.height = '100%';

    } catch (err) {
        console.error("Error accessing the webcam:", err);
        alert("Failed to access your webcam. Please check permissions and try again.");
    }
}

async function initMoveNet() {
    await tf.setBackend('webgl');
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER });
    console.log("MoveNet Model Loaded!");
}


async function startMonitoring() {
    if (height.value) {
        if (selectedExercise) {
            repCount = 0;
            exerciseStage = "Down";
            // Set the canvas element styles
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '2';
            canvas.style.width = '100%';
            canvas.style.height = '100%';

            // Ensure the video dimensions are valid
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                console.log('Canvas width set to:', canvas.width);
                console.log('Canvas height set to:', canvas.height);
            } else {
                console.error('Invalid video dimensions:', video.videoWidth, video.videoHeight);
            }

            // Start pose detection
            isMonitoring = true;
            detectPose();


            startButton.disabled = true;
            stopButton.disabled = false;
        } else {
            alert("Please select an exercise");
        }
    } else {
        heightAlert.style.display = "";
    }

}


async function stopMonitoring() {
    startButton.disabled = false;
    stopButton.disabled = true;
    boardContainer.innerHTML = "";
    const pElement = document.createElement('p');
    pElement.innerText = 'See exercise preview and read the instructions carefully';
    boardContainer.appendChild(pElement);
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    startButton.style.display = "inline-block";
    stopButton.style.display = "inline-block";
    console.log("Stopped Monitoring");
}

async function detectPose() {
    const ctx = canvas.getContext('2d');

    async function runDetection() {
        const poses = await detector.estimatePoses(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        poses.forEach(pose => {
            drawKeypoints(pose.keypoints, ctx);
            drawSkeleton(pose.keypoints, ctx);
            calculateAngleAndCountReps(pose.keypoints, ctx, selectedExercise);
        });
        requestAnimationFrame(runDetection);
    }
    runDetection();
}

function drawKeypoints(keypoints, ctx) {
    keypoints.forEach(keypoint => {
        if (keypoint.score > 0.5) {
            const { y, x } = keypoint;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
        }
    });
}

function drawSkeleton(keypoints, ctx) {
    const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);

    adjacentPairs.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        if (kp1.score > 0.5 && kp2.score > 0.5) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.strokeStyle = "cyan";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function drawAngleArc(ctx, a, b, c, angle) {
    const radius = 40;
    let startAngle, endAngle;
    if (a.y < b.y) {
        startAngle = Math.atan2(a.y - b.y, a.x - b.x);
        endAngle = Math.atan2(c.y - b.y, c.x - b.x);
    } else if (a.y > b.y) {
        startAngle = Math.atan2(c.y - b.y, c.x - b.x);
        endAngle = Math.atan2(a.y - b.y, a.x - b.x);
    }
    if (endAngle < startAngle) {
        [startAngle, endAngle] = [endAngle, startAngle];
    }
    ctx.beginPath();
    ctx.arc(b.x, b.y, radius, startAngle, endAngle);
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'yellow';
    ctx.font = '20px Arial';
    ctx.fillText(`${Math.round(angle)}°`, b.x + radius / 2, b.y - radius / 2);
}

function calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
}

function calculateAngleAndCountReps(keypoints, ctx, exercise) {
    const leftShoulder = keypoints[5];
    const leftElbow = keypoints[7];
    const leftWrist = keypoints[9];
    const rightShoulder = keypoints[6];
    const rightElbow = keypoints[8];
    const rightWrist = keypoints[10];
    const leftHip = keypoints[11];
    const leftKnee = keypoints[13];
    const leftAnkle = keypoints[15];
    let angle;

    switch (exercise) {
        case "Left Bicep Curl":
            if (leftShoulder.score > 0.2 && leftElbow.score > 0.2 && leftWrist.score > 0.2) {
                angle = calculateAngle(leftShoulder, leftElbow, leftWrist);
                if (angle > 150 && exerciseStage === "Up") {
                    exerciseStage = "Down";
                    repCount++;
                }
                if (angle < 90 && exerciseStage === "Down") {
                    exerciseStage = "Up";
                }
                drawAngleArc(ctx, leftWrist, leftElbow, leftShoulder, angle);
            }
            break;
        case "Right Bicep Curl":
            if (rightShoulder.score > 0.2 && rightElbow.score > 0.2 && rightWrist.score > 0.2) {
                angle = calculateAngle(rightShoulder, rightElbow, rightWrist);
                if (angle > 150 && exerciseStage === "Up") {
                    exerciseStage = "Down";
                    repCount++;
                }
                if (angle < 90 && exerciseStage === "Down") {
                    exerciseStage = "Up";
                }
                drawAngleArc(ctx, rightShoulder, rightElbow, rightWrist, angle);
            }
            break;
        case "Push Up":
            if (leftShoulder.score > 0.2 && leftElbow.score > 0.2 && leftWrist.score > 0.2 && leftHip.score > 0.2) {
                angle = calculateAngle(leftShoulder, leftElbow, leftWrist);
                if (angle > 150 && exerciseStage === "Up") {
                    exerciseStage = "Down";
                    repCount++;
                }
                if (angle < 90 && exerciseStage === "Down") {
                    exerciseStage = "Up";
                }
                drawAngleArc(ctx, leftWrist, leftElbow, leftShoulder, angle);
            }
            break;
        case "Squat":
            if (leftHip.score > 0.2 && leftKnee.score > 0.2 && leftAnkle.score > 0.2) {
                angle = calculateAngle(leftHip, leftKnee, leftAnkle);
                if (angle > 150 && exerciseStage === "Up") {
                    exerciseStage = "Down";
                    repCount++;
                }
                if (angle < 90 && exerciseStage === "Down") {
                    exerciseStage = "Up";
                }
                drawAngleArc(ctx, leftHip, leftKnee, leftAnkle, angle);
            }
            break;
        default:
            console.error("Invalid exercise type specified.");
            alert("Please select an exercise");
    }
    if (isMonitoring) {
        boardContainer.innerHTML = "";
        const pElement1 = document.createElement('p');
        pElement1.innerText = `Reps: ${repCount}`;
        const pElement2 = document.createElement('p');
        pElement2.innerText = `Stage: ${exerciseStage}`;
        boardContainer.appendChild(pElement1);
        boardContainer.appendChild(pElement2);
    }

}

startButton.addEventListener('click', async () => {
    await initMoveNet();
    await startMonitoring();
});

stopButton.addEventListener('click', stopMonitoring);
document.addEventListener("DOMContentLoaded", async () => {
    await initializeCamera();
    await initMoveNet();
});

