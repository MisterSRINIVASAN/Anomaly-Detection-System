from ultralytics import YOLO
import cv2
import numpy as np

class AnomalyDetector:
    def __init__(self, model_path="yolov8n.pt"):
        # Load YOLOv8 model - downloads yolov8n.pt if not exists on first run
        self.model = YOLO(model_path)

    def predict(self, image_bytes: bytes):
        try:
            # Decode image bytes to OpenCV image
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return {"error": "Failed to decode image"}
            
            # Run inference (we use verbose=False to avoid console spam on every frame)
            results = self.model(img, stream=False, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # get coordinates
                    b = box.xyxy[0].tolist()  # [xmin, ymin, xmax, ymax]
                    c = box.conf[0].item()    # confidence
                    cls = int(box.cls[0].item()) # class ID
                    name = self.model.names[cls] # class name
                    
                    detections.append({
                        "xmin": float(b[0]),
                        "ymin": float(b[1]),
                        "xmax": float(b[2]),
                        "ymax": float(b[3]),
                        "confidence": float(c),
                        "class_id": cls,
                        "class_name": name
                    })
            
            return {
                "detections": detections, 
                "image_width": img.shape[1], 
                "image_height": img.shape[0]
            }
        except Exception as e:
            return {"error": str(e)}

# Instantiate a global detector to stay warm in memory
detector = AnomalyDetector()
