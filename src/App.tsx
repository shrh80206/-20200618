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

  const fetchRecords = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/records');
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <div className="game-section">
        <Game />
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
