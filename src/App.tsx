import React, { useState } from 'react';
import SnakeGame from './components/SnakeGame';
import MusicPlayer from './components/MusicPlayer';

export default function App() {
  const [score, setScore] = useState(0);

  return (
    <div className="h-screen w-full bg-black crt scanlines flex flex-col items-center py-4 px-4 relative overflow-hidden text-[#00FFFF]">
      
      {/* Header */}
      <header className="w-full max-w-2xl flex items-center justify-between mb-4 z-10 border-b-2 border-[#FF00FF] pb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-pixel glitch" data-text="SYS.SNAKE_OS">
            SYS.SNAKE_OS
          </h1>
          <p className="text-xs mt-2 text-[#FF00FF] font-pixel">v9.9.9 // KERNEL PANIC IMMINENT</p>
        </div>
        
        <div className="jarring-border bg-black px-4 py-2">
          <span className="text-[#FF00FF] mr-2 text-xl">SEQ_SCORE:</span>
          <span className="text-2xl font-pixel">{score.toString().padStart(4, '0')}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl z-10">
        <SnakeGame onScoreChange={setScore} />
      </main>

      {/* Footer / Music Player */}
      <footer className="w-full max-w-2xl mt-4 z-10">
        <MusicPlayer />
      </footer>
    </div>
  );
}
