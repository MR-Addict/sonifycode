import React, { useState, useEffect, useRef } from 'react';
import { Visualizer } from './components/Visualizer';
import { CodeEditor } from './components/CodeEditor';
import { 
  initEngine, 
  playSequence, 
  stopPlayback, 
  exportToMidi, 
  exportToOfflineWav
} from './lib/musicEngine';
import { parseCodeToEvents } from './lib/parser';
import { MusicEvent } from './lib/types';
import { StyleId } from './lib/toneStyles';

const DEFAULT_CODE = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Listen to the rhythm of the sequence...
const limit = 10;
for (let i = 0; i < limit; i++) {
  console.log(fibonacci(i));
}`;

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('javascript');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeEvent, setActiveEvent] = useState<MusicEvent | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [styleMode, setStyleMode] = useState<StyleId>('synthwave');

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoopingRef = useRef(true);

  // Debounced auto-play when code changes
  useEffect(() => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    autoPlayTimerRef.current = setTimeout(() => {
      if (code.trim()) {
        handlePlay();
      }
    }, 1000);
  }, [code, styleMode]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      handleStop();
    } else {
      handlePlay();
    }
  }

  const handlePlay = async () => {
    if (isPlaying) {
      stopPlayback();
    }
    
    await initEngine(styleMode);
    const { events, language: detectedLanguage } = await parseCodeToEvents(code);
    
    // Map highlighted language to editor language if needed
    const langMap: Record<string, string> = {
       js: 'javascript', ts: 'typescript', py: 'python', rb: 'ruby', cs: 'csharp', cpp: 'cpp', c: 'c', go: 'go', rs: 'rust', java: 'java'
    };
    setLanguage(langMap[detectedLanguage] || detectedLanguage);
    
    if (events.length === 0) return;

    setIsPlaying(true);
    setActiveEvent(null);

    playSequence(
      events,
      (evt) => {
        setActiveEvent(evt);
      },
      () => {
        setIsPlaying(false);
        setActiveEvent(null);
      },
      true, // Loop
      styleMode
    );
  };

  const handleStop = () => {
    isLoopingRef.current = false;
    stopPlayback();
    setIsPlaying(false);
    setActiveEvent(null);
    setIsRecording(false);
  };


  const handleExportAudio = async () => {
    setIsRecording(true);
    try {
      const { events } = await parseCodeToEvents(code);
      if (events.length === 0) {
         setIsRecording(false);
         return;
      }
      const url = await exportToOfflineWav(events, styleMode);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'code-audio.wav';
        a.click();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecording(false);
    }
  };

  const handleExportMidi = async () => {
    const { events } = await parseCodeToEvents(code);
    if (events.length === 0) return;
    
    const uri = exportToMidi(events);
    const a = document.createElement('a');
    a.href = uri;
    a.download = 'code-sequence.mid';
    a.click();
  };

  return (
    <div className="h-screen w-full bg-[#050505] text-[#E6E6E6] flex flex-col font-sans overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <header className="py-3 px-4 md:py-0 md:h-16 bg-[#151619] border-b border-[#2C2E33] flex flex-col md:flex-row items-center justify-between shrink-0 shadow-md z-50 gap-3 md:gap-0">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#FF4444] to-[#cc0000] flex items-center justify-center text-white font-bold opacity-90 shadow-[0_0_15px_rgba(255,68,68,0.3)]">S</div>
          <h1 className="text-xl font-bold tracking-tighter text-white">SONIFY<span className="text-[#8E9299] font-normal tracking-widest pl-1">SYS</span></h1>
        </div>
        <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-2 md:gap-4 flex-wrap md:flex-nowrap pb-1 md:pb-0">
          <div className="flex items-center gap-2 shrink-0">
             <label className="text-[10px] text-[#8E9299] font-mono uppercase tracking-widest">Synth Preset</label>
             <select 
                value={styleMode} 
                onChange={(e) => setStyleMode(e.target.value as StyleId)}
                className="bg-[#050505] border border-[#2C2E33] rounded text-xs text-white px-2 py-1.5 outline-none focus:border-[#FF4444] font-mono cursor-pointer transition-colors"
             >
                <option value="classic">C-01 FM BASE</option>
                <option value="synthwave">S-02 SAW DELAY</option>
                <option value="ambient">A-03 REVERB SQ</option>
                <option value="retro">R-04 8BIT PULSE</option>
             </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#050505] border border-[#2C2E33] rounded shrink-0">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#FF4444] shadow-[0_0_8px_rgba(255,68,68,0.8)]' : 'bg-[#4A4A4A]'}`}></div> 
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">
              {isPlaying ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <div className="relative shrink-0">
            <button 
               onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
               className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2C2E33] hover:bg-[#3E4047] transition-colors text-xs text-white font-mono shadow-sm"
            >
               OUT
               <svg className={`w-3 h-3 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isExportMenuOpen && (
               <div className="absolute right-0 mt-2 w-48 bg-[#151619] border border-[#2C2E33] rounded shadow-xl z-50 overflow-hidden">
                 <button 
                   onClick={() => { handleExportMidi(); setIsExportMenuOpen(false); }}
                   className="w-full text-left px-4 py-3 flex items-center justify-between text-xs text-[#E6E6E6] hover:bg-[#2C2E33] transition-colors font-mono"
                 >
                   <span>SEQ DATA</span>
                   <span className="text-[10px] text-[#8E9299]">.MID</span>
                 </button>
                 <button 
                   onClick={() => { handleExportAudio(); setIsExportMenuOpen(false); }}
                   className="w-full text-left px-4 py-3 flex items-center justify-between text-xs text-[#E6E6E6] hover:bg-[#2C2E33] border-t border-[#2C2E33] font-mono transition-colors"
                 >
                   <span>OFFLINE BOUNCE</span>
                   <span className="text-[10px] text-[#8E9299]">.WAV</span>
                 </button>
               </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* Left Panel: Code Input */}
        <section className="h-[40vh] md:h-auto md:flex-none md:w-[380px] lg:w-[450px] xl:w-[580px] flex flex-col bg-[#050505] md:border-r border-[#2C2E33] shrink-0 z-10 shadow-[5px_0_20px_rgba(0,0,0,0.5)] md:shadow-none">
           <CodeEditor code={code} language={language} onChange={setCode} onPlay={handlePlayToggle} isPlaying={isPlaying} activeEvent={activeEvent} />
        </section>

        {/* Right Panel: Audio Interface */}
        <section className="flex-1 flex flex-col relative overflow-hidden bg-[#0A0A0A]">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#151619] via-[#0A0A0A] to-[#050505] pointer-events-none"></div>
           <Visualizer 
              isPlaying={isPlaying || isRecording}
              activeToken={activeEvent?.token || null}
              playType={activeEvent?.type || null}
              eventId={activeEvent?.charIndex || null}
              onPlay={() => handlePlay()}
              onStop={handleStop}
           />
        </section>
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-[#151619] border-t border-[#2C2E33] px-4 flex items-center justify-between text-[10px] text-[#8E9299] font-mono shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.2)] z-10">
        <div className="flex gap-4">
          <span>LAT: <span className="text-white">12MS</span></span>
          <span className="hidden sm:inline">BUF: <span className="text-white">512</span></span>
          <span>OUT: <span className="text-white">MASTER STR</span></span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="hidden sm:inline text-[#FF4444]/60">BUS 1 LINKED</span>
          {isRecording ? (
             <span className="text-[#FF4444] animate-pulse flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF4444] shadow-[0_0_5px_rgba(255,68,68,1)]"></div> BOUNCING AUDIO</span>
          ) : (
             <span>SYS.OK</span>
          )}
        </div>
      </footer>
    </div>
  );
}
