import { useEffect, useRef, useState } from 'react';

// LiveStream Component to capture webcam and perform real-time WS transmission
export const LiveStream = ({ onDetections, socketRef, isConnected }) => {
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);

  // Initialize Webcam
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Frame Capture and Box Drawing Loop
  useEffect(() => {
    if (!streamActive || !isConnected) return;

    const captureCanvas = captureCanvasRef.current;
    const ctxCapture = captureCanvas.getContext('2d', { willReadFrequently: true });
    const displayCanvas = displayCanvasRef.current;
    const ctxDisplay = displayCanvas.getContext('2d');
    
    // Set socket onmessage to draw boxes and pass detections to dashboard
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.detections) {
          onDetections(data.detections);
          drawBoundingBoxes(data.detections, ctxDisplay, displayCanvas.width, displayCanvas.height);
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    let interval;
    const sendFrame = () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        captureCanvas.width = width;
        captureCanvas.height = height;
        displayCanvas.width = width;
        displayCanvas.height = height;

        ctxCapture.drawImage(videoRef.current, 0, 0, width, height);
        
        // Convert to blob and send
        captureCanvas.toBlob((blob) => {
          if (blob && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(blob);
          }
        }, 'image/jpeg', 0.6); // Adjust quality to manage bandwidth
      }
    };

    // Send around ~10 frames per second to allow backend to process smoothly
    interval = setInterval(sendFrame, 100);

    return () => clearInterval(interval);
  }, [streamActive, isConnected, socketRef, onDetections]);

  // Drawing Helper
  const drawBoundingBoxes = (detections, ctx, width, height) => {
    ctx.clearRect(0, 0, width, height); // clear previous boxes
    
    detections.forEach(det => {
      const { xmin, ymin, xmax, ymax, confidence, class_name } = det;
      
      // Determine color - Anomaly usually red/orange, but we'll use a dynamic approach
      const isAnomaly = class_name === 'person' && confidence > 0.8; // Example logic
      const drawColor = isAnomaly ? '#ff4b4b' : '#66fcf1';

      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

      // Draw Label Background
      ctx.fillStyle = drawColor;
      const label = `${class_name} ${(confidence * 100).toFixed(1)}%`;
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(xmin, ymin - 25, textWidth + 10, 25);
      
      // Draw Label Text
      ctx.fillStyle = '#0b0c10';
      ctx.font = '16px Outfit';
      ctx.fillText(label, xmin + 5, ymin - 7);
    });
  };

  return (
    <div className="stream-container glass-panel">
      <video ref={videoRef} autoPlay playsInline muted />
      {/* Hidden canvas for extracting frames */}
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />
      {/* Absolute positioned canvas for rendering boxes over video */}
      <canvas ref={displayCanvasRef} className="overlay-canvas" />
    </div>
  );
};
