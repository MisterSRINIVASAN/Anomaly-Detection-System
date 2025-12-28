import { useState, useRef, useEffect, useCallback } from 'react';
import { LiveStream } from './components/LiveStream';
import { Dashboard } from './components/Dashboard';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnectPending, setIsConnectPending] = useState(false);
  const [latestDetections, setLatestDetections] = useState([]);
  const socketRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    setIsConnectPending(true);
    socketRef.current = new WebSocket('ws://localhost:8000/ws/detect');

    socketRef.current.onopen = () => {
      console.log('WS Connected');
      setIsConnected(true);
      setIsConnectPending(false);
    };

    socketRef.current.onclose = () => {
      console.log('WS Disconnected');
      setIsConnected(false);
      setIsConnectPending(false);
      // Optional: attempt reconnect here
    };

    socketRef.current.onerror = (error) => {
      console.error('WS Error:', error);
      setIsConnected(false);
      setIsConnectPending(false);
    };
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnectWebSocket();
  }, [disconnectWebSocket]);

  return (
    <div className="app-container">
      <header>
        <h1>Anomaly Detection System</h1>
        <p className="subtitle">Real-time object detection via YOLOv8 and FastAPI</p>
        
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
          <div className={`status-badge ${isConnected ? '' : 'disconnected'}`}>
            <span className={`status-indicator ${isConnected ? 'pulse' : ''}`}></span>
            {isConnected ? 'Backend Connected' : (isConnectPending ? 'Connecting...' : 'Backend Disconnected')}
          </div>
          
          {!isConnected ? (
            <button className="btn" onClick={connectWebSocket} disabled={isConnectPending}>
              {isConnectPending ? 'Connecting...' : 'Connect to Backend'}
            </button>
          ) : (
            <button className="btn danger" onClick={disconnectWebSocket}>
              Disconnect
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        <section className="stream-section">
          <LiveStream 
            onDetections={setLatestDetections} 
            socketRef={socketRef}
            isConnected={isConnected}
          />
        </section>
        
        <section className="dashboard-section">
          <Dashboard latestDetections={latestDetections} />
        </section>
      </main>
    </div>
  );
}

export default App;
