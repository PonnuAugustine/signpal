import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import Webcam from 'react-webcam';

const ASLDetector = ({ onResult }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [model, setModel] = useState(null);
  const [handposeModel, setHandposeModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [modelLoadError, setModelLoadError] = useState(null);
  const [captureMode, setCaptureMode] = useState('ready'); // 'ready', 'capturing', 'processing', 'cooldown'
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [predictionHistory, setPredictionHistory] = useState([]);
  
  // Class labels for ASL alphabet
  const classLabels = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z', 'del', 'nothing', 'space'
  ];

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      setIsModelLoading(true);
      
      try {
        // Load handpose model for hand detection
        const handModel = await handpose.load();
        setHandposeModel(handModel);
        console.log('Handpose model loaded');
        
        // Try to load the actual trained model if it exists
        let aslModel;
        try {
          // First try to load the actual trained model
          aslModel = await tf.loadLayersModel('/model/tfjs_model/model.json');
          console.log('ASL model loaded from trained model');
        } catch (error) {
          console.warn('Could not load trained model:', error);
          
          // Create a mock model for demonstration if trained model is not available
          aslModel = {
            predict: (tensor) => {
              // Return a mock prediction (random)
              return tf.tidy(() => {
                // Create a random probability distribution across our 29 classes
                const randomPrediction = tf.randomUniform([1, classLabels.length]);
                // Normalize to sum to 1 (like softmax)
                return randomPrediction.div(randomPrediction.sum());
              });
            }
          };
          console.log('Using mock ASL model instead');
        }
        
        setModel(aslModel);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setModelLoadError(error.message);
        setIsModelLoading(false);
      }
    };
    
    loadModels();
    
    // Cleanup
    return () => {
      // Dispose any tensors or models
      if (model && model.dispose) {
        model.dispose();
      }
    };
  }, []);

  // Process hand landmarks for prediction
  const preprocessHandLandmarks = (landmarks, video) => {
    return tf.tidy(() => {
      // Our trained model expects an image, not landmarks
      // So we need to capture the hand region from the video
      if (!video || !landmarks || landmarks.length === 0) {
        return null;
      }
      
      // Get bounding box of hand
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      for (const [x, y] of landmarks) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
      
      // Add padding around hand
      const padding = 50;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(video.videoWidth, maxX + padding);
      maxY = Math.min(video.videoHeight, maxY + padding);
      
      // Calculate dimensions
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Skip if the box is too small
      if (width < 20 || height < 20) {
        return null;
      }
      
      // Create a canvas to capture the hand region
      const handCanvas = document.createElement('canvas');
      handCanvas.width = 64;  // Model input size
      handCanvas.height = 64; // Model input size
      const ctx = handCanvas.getContext('2d');
      
      // Draw the hand region onto the canvas
      ctx.drawImage(
        video,
        minX, minY, width, height,  // Source rectangle
        0, 0, 64, 64                // Destination rectangle
      );
      
      // Convert the canvas to a tensor
      const tensor = tf.browser.fromPixels(handCanvas)
        .div(255.0)                    // Normalize to [0,1]
        .expandDims(0);                // Add batch dimension
      
      return tensor;
    });
  };

  // Cooldown timer
  useEffect(() => {
    if (captureMode === 'cooldown' && cooldownTimer > 0) {
      const timer = setTimeout(() => {
        setCooldownTimer(cooldownTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (captureMode === 'cooldown' && cooldownTimer <= 0) {
      setCaptureMode('ready');
    }
  }, [cooldownTimer, captureMode]);

  // Capture progress timer
  useEffect(() => {
    if (captureMode === 'capturing' && captureProgress < 100) {
      const timer = setTimeout(() => {
        setCaptureProgress(prev => prev + 5); // Increment by 5% every 50ms
      }, 50);
      return () => clearTimeout(timer);
    } else if (captureMode === 'capturing' && captureProgress >= 100) {
      setCaptureMode('processing');
      setCaptureProgress(0);
    }
  }, [captureProgress, captureMode]);

  // Hand detection and prediction loop
  useEffect(() => {
    let detectionInterval = null;
    
    const runDetection = async () => {
      if (
        isDetecting &&
        webcamRef.current &&
        webcamRef.current.video.readyState === 4 &&
        handposeModel &&
        model &&
        canvasRef.current
      ) {
        // Get video properties
        const video = webcamRef.current.video;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        // Set canvas dimensions
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        
        // Make hand detection
        const hands = await handposeModel.estimateHands(video);
        
        // Draw hand landmarks
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        
        // Draw detection state
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        
        const statusText = captureMode === 'ready' 
          ? 'Position your hand and click Capture' 
          : captureMode === 'capturing' 
            ? `Capturing... ${captureProgress}%` 
            : captureMode === 'processing' 
              ? 'Processing sign...' 
              : `Next capture in ${cooldownTimer}s`;
        
        ctx.strokeText(statusText, 20, 30);
        ctx.fillText(statusText, 20, 30);
        
        if (hands.length > 0) {
          // Process the first detected hand
          const hand = hands[0];
          
          // Draw landmarks
          drawHand(hand, ctx);
          
          // Only process if we're in capturing or processing mode
          if (captureMode === 'capturing') {
            // Store the landmark data for processing later
            setPredictionHistory(prev => {
              // Limit to 10 frames
              if (prev.length >= 10) {
                return [...prev.slice(1), hand.landmarks];
              }
              return [...prev, hand.landmarks];
            });
          } else if (captureMode === 'processing') {
            // Process the collected predictions
            processPredictions(video);
          }
        } else {
          // No hand detected
          if (captureMode === 'capturing') {
            // Reset capture if hand disappears
            setCaptureMode('ready');
            setCaptureProgress(0);
            setPredictionHistory([]);
          }
        }
      }
    };
    
    if (isDetecting) {
      detectionInterval = setInterval(runDetection, 30); // Run every 30ms for smoother display
    }
    
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [isDetecting, handposeModel, model, captureMode, captureProgress, cooldownTimer]);

  // Process the collected predictions
  const processPredictions = (video) => {
    if (predictionHistory.length === 0) {
      setCaptureMode('ready');
      return;
    }
    
    // Get the average prediction
    const results = [];
    
    tf.tidy(() => {
      // Process each frame with our model
      for (const landmarks of predictionHistory) {
        const inputTensor = preprocessHandLandmarks(landmarks, video);
        if (inputTensor === null) continue;
        
        try {
          // Make prediction
          const prediction = model.predict(inputTensor);
          const predictionArray = prediction.arraySync()[0];
          
          // Find the highest confidence class
          const maxIndex = predictionArray.indexOf(Math.max(...predictionArray));
          const confidence = predictionArray[maxIndex];
          
          if (confidence > 0.5) {
            results.push({
              letter: classLabels[maxIndex],
              confidence: confidence
            });
          }
        } catch (error) {
          console.error('Prediction error:', error);
        }
      }
    });
    
    // Find the most common prediction
    if (results.length > 0) {
      // Count occurrences of each letter
      const letterCounts = {};
      let maxCount = 0;
      let bestResult = null;
      
      for (const result of results) {
        const { letter, confidence } = result;
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
        
        if (letterCounts[letter] > maxCount || 
            (letterCounts[letter] === maxCount && 
             (!bestResult || confidence > bestResult.confidence))) {
          maxCount = letterCounts[letter];
          bestResult = result;
        }
      }
      
      // Report the most common prediction with highest confidence
      if (bestResult) {
        onResult(bestResult);
      }
    }
    
    // Reset state for next capture
    setPredictionHistory([]);
    setCaptureMode('cooldown');
    setCooldownTimer(3); // 3 second cooldown before next capture
  };

  // Draw hand landmarks on canvas
  const drawHand = (hand, ctx) => {
    // Draw landmarks
    const landmarks = hand.landmarks;
    
    // Draw points
    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = landmarks[i];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 3 * Math.PI);
      ctx.fillStyle = '#4a6bfd';
      ctx.fill();
    }
    
    // Draw connections
    ctx.beginPath();
    ctx.moveTo(landmarks[0][0], landmarks[0][1]);
    
    // Connect thumb
    for (let i = 1; i <= 4; i++) {
      ctx.lineTo(landmarks[i][0], landmarks[i][1]);
    }
    
    // Reset to wrist for index finger
    ctx.moveTo(landmarks[0][0], landmarks[0][1]);
    
    // Connect each finger
    const fingers = [
      [5, 6, 7, 8], // Index
      [9, 10, 11, 12], // Middle
      [13, 14, 15, 16], // Ring
      [17, 18, 19, 20]  // Pinky
    ];
    
    fingers.forEach(finger => {
      ctx.moveTo(landmarks[0][0], landmarks[0][1]);
      finger.forEach(point => {
        ctx.lineTo(landmarks[point][0], landmarks[point][1]);
      });
    });
    
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Start/stop detection
  const toggleDetection = () => {
    if (!isDetecting) {
      // Reset state when starting detection
      setCaptureMode('ready');
      setCaptureProgress(0);
      setPredictionHistory([]);
    }
    setIsDetecting(prev => !prev);
  };
  
  // Trigger capture
  const startCapture = () => {
    if (captureMode === 'ready' && isDetecting) {
      setCaptureMode('capturing');
      setCaptureProgress(0);
      setPredictionHistory([]);
    }
  };

  return (
    <div className="asl-detector">
      {isModelLoading ? (
        <div className="model-loading">
          <p>Loading models... Please wait.</p>
        </div>
      ) : modelLoadError ? (
        <div className="model-error">
          <p>Error loading models: {modelLoadError}</p>
          <p>Using fallback detection.</p>
        </div>
      ) : (
        <>
          <div className="webcam-container">
            <Webcam
              ref={webcamRef}
              mirrored={true}
              className="webcam"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
            <canvas
              ref={canvasRef}
              className="detection-canvas"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
              }}
            />
            
            {captureMode === 'capturing' && (
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${captureProgress}%` }}
                ></div>
              </div>
            )}
          </div>
          
          <div className="controls">
            <button
              className={`control-button ${isDetecting ? 'stop-button' : 'start-button'}`}
              onClick={toggleDetection}
            >
              {isDetecting ? 'Stop Camera' : 'Start Camera'}
            </button>
            
            {isDetecting && (
              <button
                className={`capture-button ${captureMode !== 'ready' ? 'disabled' : ''}`}
                onClick={startCapture}
                disabled={captureMode !== 'ready'}
              >
                Capture Sign
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ASLDetector; 