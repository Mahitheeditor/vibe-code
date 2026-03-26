import React, { useState, useRef, useEffect } from 'react';

const TRACKS = [
  { id: 1, title: "ERR_01: NEURAL_DECAY", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "ERR_02: SYSTEM_HALT", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "ERR_03: MEMORY_LEAK", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

export default function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const handlePrev = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const progressChars = Math.floor((progress / 100) * 20);
  const bar = '[' + '='.repeat(progressChars) + '>'.padEnd(20 - progressChars, ' ') + ']';

  return (
    <div className="w-full jarring-border bg-black p-4 flex flex-col gap-2">
      <audio ref={audioRef} src={currentTrack.url} onTimeUpdate={handleTimeUpdate} onEnded={handleNext} />
      
      <div className="flex justify-between items-end border-b border-[#00FFFF] pb-1">
        <span className="text-[#FF00FF] font-bold text-xl">AUDIO_SUBSYSTEM</span>
        <span className={`text-xl ${isPlaying ? 'animate-pulse text-[#00FFFF]' : 'text-gray-600'}`}>
          {isPlaying ? 'ACTIVE' : 'IDLE'}
        </span>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="truncate w-1/2">
          <span className="text-[#00FFFF] text-xl">&gt; {currentTrack.title}</span>
        </div>
        <div className="font-pixel text-xs md:text-sm text-[#FF00FF]">
          {bar}
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <button onClick={handlePrev} className="text-xl hover:bg-[#00FFFF] hover:text-black px-2 py-1 transition-none border border-transparent hover:border-[#00FFFF]">[PREV]</button>
        <button onClick={togglePlay} className="text-xl hover:bg-[#FF00FF] hover:text-black px-2 py-1 transition-none border border-transparent hover:border-[#FF00FF]">
          {isPlaying ? '[PAUSE]' : '[PLAY]'}
        </button>
        <button onClick={handleNext} className="text-xl hover:bg-[#00FFFF] hover:text-black px-2 py-1 transition-none border border-transparent hover:border-[#00FFFF]">[NEXT]</button>
      </div>
    </div>
  );
}
