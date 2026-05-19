import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface VisualizerProps {
  isPlaying: boolean;
  activeToken: string | null;
  playType: string | null;
  eventId: number | null;
  onPlay: () => void;
  onStop: () => void;
}

export function Visualizer({ 
  isPlaying, 
  activeToken, 
  playType,
  eventId,
  onPlay, 
  onStop
}: VisualizerProps) {
  
  const getPulseColor = () => {
    if (!activeToken) return 'rgba(255,255,255,0.05)';
    switch (playType) {
      case 'chord': return '#4A90E2'; // Blue
      case 'melody': return '#50E3C2'; // Teal
      case 'kick': return '#FF4444'; // Red
      case 'hat': return '#F5A623'; // Orange
      default: return '#E6E6E6';
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
         {/* Hardware Interface Circles */}
         <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
           <motion.div 
             className="absolute w-[280px] h-[280px] rounded-full border border-dashed border-[#4A4A4A]"
             animate={{ 
                rotate: isPlaying ? 360 : 0,
                scale: activeToken && playType === 'kick' ? 1.05 : 1 
             }}
             transition={{ 
                rotate: { duration: 40, repeat: Infinity, ease: "linear" },
                scale: { type: "spring", stiffness: 300, damping: 10 } 
             }}
           />
           <motion.div 
             className="absolute w-[400px] h-[400px] rounded-full border border-dashed border-[#2C2E33]"
             animate={{ 
                rotate: isPlaying ? -360 : 0,
                scale: activeToken && playType === 'chord' ? 1.02 : 1
             }}
             transition={{ 
                rotate: { duration: 60, repeat: Infinity, ease: "linear" },
                scale: { type: "spring", stiffness: 300, damping: 15 } 
             }}
           />
         </div>

         {/* Visualizer Area */}
         <div className="w-full h-48 flex items-end justify-center gap-1.5 mb-8 z-10 relative">
            {/* Dynamic Shape Layer */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none overflow-hidden h-full text-center bottom-0">
               <AnimatePresence>
                  {activeToken && playType === 'chord' && (
                     <motion.div
                       key={`chord-${eventId}`}
                       className="absolute flex items-center justify-center bottom-10"
                     >
                        {[...Array(3)].map((_, idx) => (
                           <motion.div 
                              key={idx}
                              initial={{ scale: 0.5, opacity: 1, borderRadius: '20%' }}
                              animate={{ scale: 2 + idx, opacity: 0, rotate: 90 }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="absolute w-32 h-32 border border-[#4A90E2]/50 shadow-[0_0_15px_rgba(74,144,226,0.3)]"
                           />
                        ))}
                     </motion.div>
                  )}
                  {activeToken && playType === 'kick' && (
                     <motion.div
                       key={`kick-${eventId}`}
                       className="absolute bottom-10 w-40 h-40 bg-[#FF4444]/20 rounded-full blur-xl"
                       initial={{ scale: 0.5, opacity: 1 }}
                       animate={{ scale: 3, opacity: 0 }}
                       transition={{ duration: 0.4, ease: "easeOut" }}
                     />
                  )}
                  {activeToken && playType === 'hat' && (
                     <motion.div
                       key={`hat-${eventId}`}
                       className="absolute flex items-center justify-center bottom-24"
                     >
                        {[...Array(8)].map((_, idx) => (
                           <motion.div 
                              key={idx}
                              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                              animate={{ 
                                 scale: 1, 
                                 x: Math.cos(idx * Math.PI / 4) * 80, 
                                 y: Math.sin(idx * Math.PI / 4) * 80, 
                                 opacity: 0 
                              }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="absolute w-1 h-4 bg-[#F5A623] rounded-sm"
                              style={{ rotate: `${idx * 45 + 90}deg` }}
                           />
                        ))}
                     </motion.div>
                  )}
                  {activeToken && playType === 'melody' && (
                     <motion.svg 
                        key={`melody-${eventId}`}
                        width="200" height="100" viewBox="0 0 200 100"
                        initial={{ opacity: 1, scale: 0.8 }}
                        animate={{ opacity: 0, scale: 1.5, y: -40 }}
                        transition={{ duration: 0.6 }}
                        className="absolute bottom-10 stroke-[#50E3C2] stroke-1 fill-transparent"
                     >
                         <motion.path 
                            d="M 0 50 Q 50 0 100 50 T 200 50" 
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3 }}
                         />
                     </motion.svg>
                  )}
               </AnimatePresence>
            </div>

            {/* Visualizer bars */}
            {[...Array(16)].map((_, i) => {
              let targetHeight = 10;
              if (activeToken) {
                 if (playType === 'chord') targetHeight = Math.random() * 80 + 20;
                 else if (playType === 'kick') targetHeight = i % 4 === 0 || i === 7 ? 100 : 20;
                 else if (playType === 'hat') targetHeight = i % 2 !== 0 ? 60 : 10;
                 else if (playType === 'melody') targetHeight = Math.sin((i + activeToken.length * Math.random()) * 0.5) * 40 + 50;
                 else targetHeight = Math.random() * 40 + 10;
              } else if (isPlaying) {
                 targetHeight = Math.random() * 15 + 5;
              }

              return (
                <motion.div 
                  key={i} 
                  className={`w-2.5 ${i % 2 === 0 ? 'bg-[#4AAAFF]' : 'bg-[#50E3C2]'}`}
                  initial={{ height: '10%', opacity: 0.2 }}
                  animate={isPlaying || activeToken ? { 
                    height: `${targetHeight}%`,
                    opacity: activeToken ? 0.9 : (isPlaying ? 0.5 : 0.2)
                  } : {
                    height: ['10%', '15%', '10%'],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={isPlaying || activeToken ? { type: "spring", stiffness: 400, damping: 25 } : {
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                />
              );
            })}
         </div>

         <div className="text-center z-10 h-32 relative flex flex-col items-center justify-start w-full">
            <AnimatePresence mode="popLayout">
              {activeToken ? (
                <motion.div
                  key={`token-${eventId}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute"
                >
                  <span className="font-mono text-5xl font-bold tracking-tighter" style={{ color: getPulseColor() }}>
                    {activeToken}
                  </span>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center mt-2 border border-[#2C2E33] px-6 py-4 bg-[#151619] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  <h2 className="text-xl font-bold text-white tracking-widest font-mono">TONE OUTPUT ENG</h2>
                  <p className="text-[#8E9299] text-[10px] mt-2 uppercase tracking-[0.3em] font-mono">SYNTH DEF • 44.1KHZ • 24BIT</p>
                </div>
              )}
            </AnimatePresence>
         </div>
      </div>

      {/* Control Panel Widget */}
      <div className="bg-[#151619] p-4 md:p-6 border-t border-[#2C2E33] relative">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={isPlaying ? onStop : onPlay}
              className={`w-12 h-12 flex items-center justify-center rounded-full border border-[#2C2E33] transition-colors ${isPlaying ? 'bg-[#0A0A0A] hover:bg-[#2C2E33] text-white' : 'bg-[#E6E6E6] hover:bg-white text-black'}`}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-[#FF4444]" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"></path></svg>
              ) : (
                <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E9299]">STATE</span>
              <span className={`text-lg font-mono font-bold tracking-widest ${isPlaying ? 'text-[#50E3C2]' : 'text-white'}`}>
                {isPlaying ? 'PLAYING' : 'STOPPED'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-widest font-mono text-[#8E9299] uppercase border border-[#2C2E33] px-2 rounded py-1">BPM</span>
            <input type="number" readOnly value="120" className="w-16 bg-[#0A0A0A] border border-[#2C2E33] rounded px-2 py-1.5 text-sm font-mono text-white outline-none text-center" />
          </div>
        </div>

        <div className="grid grid-cols-1 border border-[#2C2E33] rounded bg-[#0A0A0A] overflow-hidden">
             <div className="border-b border-[#2C2E33] px-4 py-2 bg-[#151619]">
                <h3 className="text-[10px] font-mono text-[#8E9299] uppercase tracking-widest">PARSING LOGS</h3>
             </div>
             <div className="p-4 text-[10px] font-mono text-[#4A4A4A] leading-relaxed max-h-[80px] overflow-y-auto">
               {isPlaying ? (
                 <span className="text-[#50E3C2]">
                   [00:00:00] <span className="text-[#8E9299]">SEQ INIT...</span><br/>
                   [00:00:01] <span className="text-[#8E9299]">FREQ MAPPING...</span><br/>
                   <span className="text-white">&gt; OP: {activeToken || '...'}</span>
                 </span>
               ) : (
                 <span>
                   [SYS.READY] <span className="text-[#8E9299]">WAITING FOR INPUT.</span><br/>
                   [SYS.WAIT] <span className="text-[#8E9299]">SEQ MODULE STANDBY.</span><br/>
                   <span className="text-white animate-pulse">&gt; _</span>
                 </span>
               )}
             </div>
        </div>
      </div>
    </>
  );
}
