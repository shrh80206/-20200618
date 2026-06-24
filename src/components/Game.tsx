import { useState, useEffect } from 'react'
import axios from 'axios'

type Color = 'w' | 'b'
type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k'
type Piece = { type: PieceType; color: Color } | null

const unicodeMap: Record<string, string> = {
  k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙',
  K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟',
}

function makeInitialBoard(): Piece[][] {
  const layout: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
  const board: Piece[][] = Array(8).fill(null).map(() => Array(8).fill(null))
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: layout[i], color: 'b' }
    board[1][i] = { type: 'p', color: 'b' }
    board[6][i] = { type: 'p', color: 'w' }
    board[7][i] = { type: layout[i], color: 'w' }
  }
  return board
}

export default function Game({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [board, setBoard] = useState<Piece[][]>(() => makeInitialBoard())
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null)
  const [turn, setTurn] = useState<Color>('w')
  const [winner, setWinner] = useState<Color | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [captured, setCaptured] = useState<{ w: PieceType[], b: PieceType[] }>({ w: [], b: [] })
  const [history, setHistory] = useState<string[]>([])
  const [movesCount, setMovesCount] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // 當勝負揭曉時，儲存到後端
  useEffect(() => {
    if (winner) {
      saveRecord(winner);
    }
  }, [winner]);

  const saveRecord = async (winnerColor: Color) => {
    try {
      await axios.post(`${apiBaseUrl}/api/records`, {
        winner: winnerColor === 'w' ? 'White' : 'Black',
        moves_count: movesCount
      });
      console.log('Record saved successfully');
    } catch (error) {
      console.error('Failed to save record:', error);
    }
  };

  const isValidMove = (srcR: number, srcC: number, dstR: number, dstC: number): boolean => {
    const p = board[srcR][srcC]
    if (!p) return false
    const target = board[dstR][dstC]
    if (target && target.color === p.color) return false
    const dr = dstR - srcR, dc = dstC - srcC
    const absDr = Math.abs(dr), absDc = Math.abs(dc)

    switch (p.type) {
      case 'p':
        const dir = p.color === 'w' ? -1 : 1
        if (dc === 0 && !target) {
          if (dr === dir) return true
          if (dr === 2 * dir && (srcR === 1 || srcR === 6) && !board[srcR + dir][srcC]) return true
        }
        if (absDc === 1 && dr === dir && target) return true        
        return false
      case 'r': return (dr === 0 || dc === 0) && isPathClear(srcR, srcC, dstR, dstC)
      case 'n': return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2)
      case 'b': return absDr === absDc && isPathClear(srcR, srcC, dstR, dstC)
      case 'q': return (dr === 0 || dc === 0 || absDr === absDc) && isPathClear(srcR, srcC, dstR, dstC)
      case 'k': return absDr <= 1 && absDc <= 1
      default: return false
    }
  }

  const isPathClear = (sr: number, sc: number, dr: number, dc: number): boolean => {
    const stepR = dr === sr ? 0 : (dr > sr ? 1 : -1)
    const stepC = dc === sc ? 0 : (dc > sc ? 1 : -1)
    let currR = sr + stepR, currC = sc + stepC
    while (currR !== dr || currC !== dc) {
      if (board[currR][currC]) return false
      currR += stepR; currC += stepC
    }
    return true
  }

  function onSquareClick(r: number, c: number) {
    if (winner) return
    if (selected) {
      if (isValidMove(selected.r, selected.c, r, c)) {
        const p = board[selected.r][selected.c]!
        const target = board[r][c]
        const newBoard = board.map(row => [...row])

        if (target) {
          setCaptured(prev => ({ ...prev, [target.color]: [...prev[target.color], target.type] }))
        }

        const moveStr = `${p.type.toUpperCase()}${String.fromCharCode(97+selected.c)}${8-selected.r}→${String.fromCharCode(97+c)}${8-r}${target ? '†' : ''}`
        setHistory(prev => [moveStr, ...prev].slice(0, 10))
        setMovesCount(prev => prev + 1)

        if (p.type === 'p' && (r === 0 || r === 7)) {
          newBoard[r][c] = { type: 'q', color: p.color }
        } else {
          newBoard[r][c] = p
        }
        newBoard[selected.r][selected.c] = null

        setBoard(newBoard)
        if (target?.type === 'k') setWinner(turn)
        setTurn(turn === 'w' ? 'b' : 'w')
        setSelected(null)
      } else {
        const piece = board[r][c]
        if (piece && piece.color === turn) setSelected({ r, c })    
        else setSelected(null)
      }
    } else {
      const piece = board[r][c]
      if (piece && piece.color === turn) setSelected({ r, c })      
    }
  }

  return (
    <div className={`game-wrapper ${winner ? 'game-over' : ''}`}>   
      <div className="mode-toggle">
        <button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? '🌙 DARK' : '☀️ LIGHT'}</button>
      </div>
      <h2 className="section-title">Grand Chess</h2>

      <div className="game-layout">
        <div className="side-panel history-panel">
          <h3>LOG</h3>
          <div className="history-list">
            {history.map((m, i) => <div key={i} className="history-item">{m}</div>)}
          </div>
        </div>

        <div className="main-game-area">
          <div className="captured-panel b">
            {captured.w.map((p, i) => <span key={i} className="cap-pc">{unicodeMap[p.toUpperCase()]}</span>)}
          </div>
          <div className="game-info">
            {!winner ? (
              <div className="turn-indicator"><span className={`dot ${turn}`}></span>{turn === 'w' ? 'White' : 'Black'}</div>
            ) : (
              <div className="winner-banner animate-glitch" data-text={`${winner === 'w' ? 'WHITE' : 'BLACK'} VICTORIOUS`}>{winner === 'w' ? 'WHITE' : 'BLACK'} VICTORIOUS</div>
            )}
          </div>
          <div className="board">
            {board.map((row, r) => row.map((cell, c) => (
              <div key={`${r}-${c}`} className={`sq ${(r+c)%2 ? 'sq-d' : 'sq-l'} ${selected?.r===r && selected?.c===c ? 'sq-s' : ''}`} onClick={() => onSquareClick(r, c)}>
                {cell && <span className={`pc ${cell.color} ${cell.type}`}>{unicodeMap[cell.color === 'w' ? cell.type.toUpperCase() : cell.type.toLowerCase()]}</span>}
              </div>
            )))}
          </div>
          <div className="captured-panel w">
            {captured.b.map((p, i) => <span key={i} className="cap-pc">{unicodeMap[p]}</span>)}
          </div>
        </div>
      </div>

      {winner && (
        <div className="overlay animate-fadein">
          <div className="modal">
            <h1 className="glitch-text-winner" data-text="CHECKMATE">CHECKMATE</h1>
            <p>{winner === 'w' ? 'White' : 'Black'} dominates.</p>  
            <button onClick={() => { setBoard(makeInitialBoard()); setWinner(null); setTurn('w'); setCaptured({ w: [], b: [] }); setHistory([]); setMovesCount(0); }}>REMATCH</button>
          </div>
        </div>
      )}
    </div>
  )
}
