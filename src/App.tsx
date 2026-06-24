import { useState, useEffect } from 'react'
import axios from 'axios'
import Game from './components/Game'
import './App.css'

interface Record {
  id: number;
  winner: string;
  moves_count: number;
  played_at: string;
}

function App() {
  const [records, setRecords] = useState<Record[]>([]);

  // 自動判斷 API 網址：如果是在雲端，就連到 Render 的後端，否則連到 localhost
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://20200618.onrender.com';

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/records`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  return (
    <div className="app-container">
      <div className="game-section">
        <Game apiBaseUrl={API_BASE_URL} />
      </div>
      <div className="records-section">
        <h3>🏆 Recent Matches</h3>
        <div className="records-list">
          {records.length === 0 ? (
            <p>No records yet. Start playing!</p>
          ) : (
            records.map(record => (
              <div key={record.id} className="record-card">
                <div className="record-winner">{record.winner} Won</div>
                <div className="record-details">
                  Moves: {record.moves_count} | {new Date(record.played_at).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default App
