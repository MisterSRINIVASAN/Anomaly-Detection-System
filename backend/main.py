from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from core.inference import detector

app = FastAPI(title="Real-Time Anomaly Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Anomaly Detection System Running"}

@app.websocket("/ws/detect")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive image frame as bytes
            data = await websocket.receive_bytes()
            
            # Run YOLOv8 inference
            results = detector.predict(data)
            
            # Send bounding boxes back to frontend
            await websocket.send_json(results)
    except WebSocketDisconnect:
        print("Frontend client disconnected")
    except Exception as e:
        print(f"Error during WS prediction: {e}")
