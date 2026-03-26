import React, { useEffect, useRef, useState, useCallback } from 'react';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

const GRID_SIZE = 20;
const TILE_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * TILE_SIZE;

const DIFFICULTY_SETTINGS = {
  EASY: { speed: 150, radius: 20 },
  MEDIUM: { speed: 100, radius: 10 },
  HARD: { speed: 60, radius: 5 }
};

interface SnakeGameProps {
  onScoreChange: (score: number) => void;
}

export default function SnakeGame({ onScoreChange }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Mutable game state for requestAnimationFrame
  const gameRef = useRef({
    snake: [{ x: 10, y: 10 }],
    dir: { x: 0, y: -1 },
    nextDir: { x: 0, y: -1 },
    food: { x: 5, y: 5 },
    particles: [] as any[],
    shake: 0,
    lastTime: 0,
    accumulator: 0,
    isPaused: false
  });

  const generateFood = useCallback((currentSnake: {x:number, y:number}[], diff: Difficulty) => {
    const head = currentSnake[0];
    const radius = DIFFICULTY_SETTINGS[diff].radius;
    let newFood = { x: 0, y: 0 };
    let attempts = 0;
    
    while (true) {
      attempts++;
      if (attempts > 100) {
         newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
      } else {
         const minX = Math.max(0, head.x - radius);
         const maxX = Math.min(GRID_SIZE - 1, head.x + radius);
         const minY = Math.max(0, head.y - radius);
         const maxY = Math.min(GRID_SIZE - 1, head.y + radius);
         newFood = {
           x: minX + Math.floor(Math.random() * (maxX - minX + 1)),
           y: minY + Math.floor(Math.random() * (maxY - minY + 1)),
         };
      }
      if (!currentSnake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
    }
    return newFood;
  }, []);

  const spawnParticles = (x: number, y: number, color: string) => {
    const p = [];
    for(let i=0; i<15; i++) {
      p.push({
        x: x * TILE_SIZE + TILE_SIZE/2,
        y: y * TILE_SIZE + TILE_SIZE/2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color
      });
    }
    gameRef.current.particles.push(...p);
  };

  const startGame = () => {
    gameRef.current = {
      ...gameRef.current,
      snake: [{ x: 10, y: 10 }],
      dir: { x: 0, y: -1 },
      nextDir: { x: 0, y: -1 },
      food: generateFood([{ x: 10, y: 10 }], difficulty),
      particles: [],
      shake: 0,
      accumulator: 0,
      isPaused: false
    };
    setScore(0);
    onScoreChange(0);
    setIsPaused(false);
    setGameState('PLAYING');
  };

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (gameState !== 'PLAYING') return;
      
      const { dir } = gameRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': if (dir.y !== 1) gameRef.current.nextDir = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': if (dir.y !== -1) gameRef.current.nextDir = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': if (dir.x !== 1) gameRef.current.nextDir = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': if (dir.x !== -1) gameRef.current.nextDir = { x: 1, y: 0 }; break;
        case ' ': 
          gameRef.current.isPaused = !gameRef.current.isPaused; 
          setIsPaused(gameRef.current.isPaused);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    let animationFrameId: number;

    const loop = (time: number) => {
      const state = gameRef.current;
      if (!state.lastTime) state.lastTime = time;
      const deltaTime = time - state.lastTime;
      state.lastTime = time;

      if (!state.isPaused) {
        state.accumulator += deltaTime;
        const speed = DIFFICULTY_SETTINGS[difficulty].speed;

        // Update Snake
        if (state.accumulator >= speed) {
          state.accumulator -= speed;
          state.dir = state.nextDir;
          const head = state.snake[0];
          const newHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };

          // Collisions
          if (
            newHead.x < 0 || newHead.x >= GRID_SIZE ||
            newHead.y < 0 || newHead.y >= GRID_SIZE ||
            state.snake.some(s => s.x === newHead.x && s.y === newHead.y)
          ) {
            state.shake = 20;
            spawnParticles(head.x, head.y, '#FF00FF');
            setGameState('GAME_OVER');
            return; // Stop updating
          }

          const newSnake = [newHead, ...state.snake];

          if (newHead.x === state.food.x && newHead.y === state.food.y) {
            state.shake = 5;
            spawnParticles(state.food.x, state.food.y, '#00FFFF');
            state.food = generateFood(newSnake, difficulty);
            setScore(s => {
              const ns = s + 10;
              onScoreChange(ns);
              return ns;
            });
          } else {
            newSnake.pop();
          }
          state.snake = newSnake;
        }

        // Update Particles
        state.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
        });
        state.particles = state.particles.filter(p => p.life > 0);
        
        // Update Shake
        if (state.shake > 0) state.shake *= 0.9;
        if (state.shake < 0.5) state.shake = 0;
      }

      // Draw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

          ctx.save();
          if (state.shake > 0) {
            const dx = (Math.random() - 0.5) * state.shake;
            const dy = (Math.random() - 0.5) * state.shake;
            ctx.translate(dx, dy);
          }

          // Draw Grid (optional, maybe subtle)
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          for(let i=0; i<=GRID_SIZE; i++) {
            ctx.beginPath(); ctx.moveTo(i*TILE_SIZE, 0); ctx.lineTo(i*TILE_SIZE, CANVAS_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i*TILE_SIZE); ctx.lineTo(CANVAS_SIZE, i*TILE_SIZE); ctx.stroke();
          }

          // Draw Food (Magenta)
          ctx.fillStyle = '#FF00FF';
          ctx.shadowColor = '#FF00FF';
          ctx.shadowBlur = 10;
          ctx.fillRect(state.food.x * TILE_SIZE + 2, state.food.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          // Draw Snake (Cyan)
          ctx.fillStyle = '#00FFFF';
          ctx.shadowColor = '#00FFFF';
          ctx.shadowBlur = 10;
          state.snake.forEach((s, i) => {
            if (i === 0) ctx.fillStyle = '#FFFFFF'; // Head
            else ctx.fillStyle = '#00FFFF';
            ctx.fillRect(s.x * TILE_SIZE + 1, s.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          });

          // Draw Particles
          ctx.shadowBlur = 0;
          state.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, 4, 4);
          });
          ctx.globalAlpha = 1.0;

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, difficulty, generateFood, onScoreChange]);

  return (
    <div className="relative w-full max-w-[400px] aspect-square jarring-border bg-black">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full h-full block"
      />

      {/* Overlays */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 p-4 text-center">
          <h2 className="text-2xl font-pixel glitch mb-8" data-text="INIT_SEQUENCE">INIT_SEQUENCE</h2>
          <div className="flex flex-col gap-4 w-full max-w-[200px] mb-8">
            {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`px-4 py-2 font-pixel text-xs transition-none ${
                  difficulty === diff 
                    ? 'bg-[#FF00FF] text-black' 
                    : 'border border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black'
                }`}
              >
                [{diff}]
              </button>
            ))}
          </div>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-[#00FFFF] text-black font-pixel text-sm hover:bg-[#FF00FF] transition-none"
          >
            EXECUTE
          </button>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10">
          <h2 className="text-3xl font-pixel glitch mb-2 text-[#FF00FF]" data-text="FATAL_ERR">FATAL_ERR</h2>
          <p className="text-xl text-[#00FFFF] mb-8 font-pixel">SCORE:{score}</p>
          <div className="flex flex-col gap-4 w-full max-w-[200px]">
            <button 
              onClick={startGame}
              className="px-6 py-2 border border-[#00FFFF] text-[#00FFFF] font-pixel text-xs hover:bg-[#00FFFF] hover:text-black transition-none"
            >
              REBOOT
            </button>
            <button 
              onClick={() => setGameState('MENU')}
              className="px-6 py-2 border border-[#FF00FF] text-[#FF00FF] font-pixel text-xs hover:bg-[#FF00FF] hover:text-black transition-none"
            >
              ABORT
            </button>
          </div>
        </div>
      )}
      
      {isPaused && gameState === 'PLAYING' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <h2 className="text-2xl font-pixel text-[#00FFFF] animate-pulse">SYSTEM_PAUSED</h2>
        </div>
      )}
    </div>
  );
}
