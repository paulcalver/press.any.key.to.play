// Face detection module using ml5.faceMesh
let faceMesh;
let isLooking = false;
let faces = [];
let notLookingFrames = 0; // Count consecutive frames of not looking
let lookingFrames = 0; // Count consecutive frames of looking
const FRAMES_REQUIRED = 10; // Frames needed to change state (~167ms - ignores blinks but catches sustained closure)

function initFaceDetection(videoElement, callback) {
  faceMesh = ml5.faceMesh(videoElement, () => {
    console.log('facemesh ready');
    faceMesh.detectStart(videoElement, (results) => {
      detectFaceAttention(results);
      if (callback) callback();
    });
  });
}

function detectFaceAttention(results) {
  faces = results;
  
  if (results.length === 0) {
    isLooking = false;
    return;
  }
  
  const face = results[0];
  const keypoints = face.keypoints;

  // Check if we have enough keypoints
  if (!keypoints || keypoints.length < 300) {
    isLooking = false;
    return;
  }

  // Use eye corner keypoints to estimate gaze
  // Left eye: 33 (outer), 133 (inner), 159 (upper), 145 (lower)
  // Right eye: 362 (inner), 263 (outer), 386 (upper), 374 (lower)
  // Nose tip: 1
  
  const leftEyeOuter = keypoints[33];
  const leftEyeInner = keypoints[133];
  const leftEyeUpper = keypoints[159];
  const leftEyeLower = keypoints[145];
  
  const rightEyeInner = keypoints[362];
  const rightEyeOuter = keypoints[263];
  const rightEyeUpper = keypoints[386];
  const rightEyeLower = keypoints[374];
  
  const nose = keypoints[1];
  
  if (!leftEyeOuter || !leftEyeInner || !rightEyeInner || !rightEyeOuter || !nose ||
      !leftEyeUpper || !leftEyeLower || !rightEyeUpper || !rightEyeLower) {
    isLooking = false;
    return;
  }
  
  // Calculate eye openness (vertical distance between upper and lower eyelid)
  const leftEyeHeight = Math.abs(leftEyeUpper.y - leftEyeLower.y);
  const rightEyeHeight = Math.abs(rightEyeUpper.y - rightEyeLower.y);
  const leftEyeWidth = Math.abs(leftEyeInner.x - leftEyeOuter.x);
  const rightEyeWidth = Math.abs(rightEyeInner.x - rightEyeOuter.x);
  
  // Eye aspect ratio - if too small, eyes are closed
  const leftEyeRatio = leftEyeHeight / leftEyeWidth;
  const rightEyeRatio = rightEyeHeight / rightEyeWidth;
  const eyeOpenThreshold = 0.15; // Adjust sensitivity
  
  const eyesOpen = (leftEyeRatio > eyeOpenThreshold && rightEyeRatio > eyeOpenThreshold);
  
  // Calculate eye centers
  const leftEyeCenterX = (leftEyeOuter.x + leftEyeInner.x) / 2;
  const rightEyeCenterX = (rightEyeOuter.x + rightEyeInner.x) / 2;
  
  // Calculate face center (midpoint between eyes)
  const faceCenterX = (leftEyeCenterX + rightEyeCenterX) / 2;
  
  // Calculate nose offset from face center
  const noseOffset = Math.abs(nose.x - faceCenterX);
  
  // Calculate eye distance for normalization
  const eyeDistance = Math.abs(leftEyeCenterX - rightEyeCenterX);
  
  // Normalized offset (ratio of nose offset to eye distance)
  const normalizedOffset = noseOffset / eyeDistance;
  
  // Check if currently looking: eyes open AND face centered
  const threshold = 0.2;
  const currentlyLooking = eyesOpen && (normalizedOffset < threshold);
  
  // Smoothing: require multiple consecutive frames to change state
  if (currentlyLooking) {
    lookingFrames++;
    notLookingFrames = 0;
    
    // Switch to looking if enough consecutive frames
    if (!isLooking && lookingFrames >= FRAMES_REQUIRED) {
      isLooking = true;
    } else if (isLooking) {
      // Already looking, stay looking
      isLooking = true;
    }
  } else {
    notLookingFrames++;
    lookingFrames = 0;
    
    // Switch to not looking if enough consecutive frames
    if (isLooking && notLookingFrames >= FRAMES_REQUIRED) {
      isLooking = false;
    } else if (!isLooking) {
      // Already not looking, stay not looking
      isLooking = false;
    }
  }
}

function getIsLooking() {
  return isLooking;
}

function getFaces() {
  return faces;
}
