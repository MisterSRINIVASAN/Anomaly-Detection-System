import { useEffect, useState } from 'react';

export const Dashboard = ({ latestDetections }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (latestDetections && latestDetections.length > 0) {
      const newLogs = latestDetections.map((det) => ({
        id: crypto.randomUUID(),
        className: det.class_name,
        confidence: det.confidence,
        timestamp: new Date().toLocaleTimeString(),
        // Just a dummy logic: treating anything with high confidence as an anomaly alert
        isAnomaly: det.confidence > 0.7 
      }));

      // Prepend to logs and keep only the latest 20
      setLogs(prev => [...newLogs, ...prev].slice(0, 20));
    }
  }, [latestDetections]);

  // Aggregate stats
  const totalAnomalies = logs.filter(l => l.isAnomaly).length;

  return (
    <div className="dashboard-container">
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2>System Status</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="subtitle">Running: <strong>YOLOv8 Nano</strong></p>
            <p className="subtitle">FPS Target: <strong>10</strong></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, color: totalAnomalies > 5 ? 'var(--danger)' : 'var(--accent-color)' }}>
              {totalAnomalies} High Confidence Dets
            </h2>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h2>Live Detection Logs</h2>
        <ul className="log-list">
          {logs.map(log => (
            <li key={log.id} className={`log-item ${log.isAnomaly ? 'anomaly' : ''}`}>
              <div>
                <strong>{log.className.toUpperCase()}</strong> detected
                <span style={{ marginLeft: '10px', fontSize: '0.9rem' }}>
                  ({(log.confidence * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="log-time">{log.timestamp}</div>
            </li>
          ))}
          {logs.length === 0 && (
            <li className="log-item" style={{ opacity: 0.5, justifyContent: 'center' }}>
              Waiting for detections...
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
