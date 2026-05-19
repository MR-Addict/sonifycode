import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { MusicEvent } from '../lib/types';
import { SNIPPETS } from '../lib/snippets';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  onPlay: () => void;
  isPlaying: boolean;
  activeEvent?: MusicEvent | null;
}

function getPosition(code: string, charIndex: number) {
  let line = 1;
  let column = 1;
  for (let i = 0; i < charIndex; i++) {
    if (code[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { lineNumber: line, column };
}

export function CodeEditor({ code, language, onChange, onPlay, isPlaying, activeEvent }: CodeEditorProps) {
  const tokenCount = code.trim() ? code.trim().split(/\s+/).length : 0;
  
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<any>(null);
  const [isSnippetsOpen, setIsSnippetsOpen] = useState(false);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
    decorationsRef.current = editor.createDecorationsCollection();
  }

  useEffect(() => {
    if (!editorRef.current || !decorationsRef.current) return;
    
    if (activeEvent && activeEvent.charIndex !== undefined) {
      const position = getPosition(code, activeEvent.charIndex);
      const endColumn = position.column + activeEvent.token.length;

      const decoration = {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: endColumn
        },
        options: {
          inlineClassName: 'monaco-highlight',
          isWholeLine: false,
        }
      };

      decorationsRef.current.set([decoration]);
      editorRef.current.revealPositionInCenterIfOutsideViewport(position);
    } else {
      decorationsRef.current.clear();
    }
  }, [activeEvent, code]);
  
  return (
    <>
      <div className="h-10 px-4 flex items-center justify-between border-b border-[#2C2E33] bg-[#0A0A0A] shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#8E9299]">EDITOR [{language}]</span>
          
          <div className="relative">
            <button 
              onClick={() => setIsSnippetsOpen(!isSnippetsOpen)}
              className="px-2 py-1 flex items-center gap-1 bg-[#151619] border border-[#2C2E33] hover:border-[#4A4A4A] text-[#E6E6E6] rounded text-[10px] transition-colors uppercase tracking-wider font-mono shadow-sm"
            >
              SEQ DB
              <svg className={`w-3 h-3 transition-transform ${isSnippetsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isSnippetsOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#151619] border border-[#2C2E33] rounded shadow-xl z-50 overflow-hidden font-mono">
                {SNIPPETS.map((snippet, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onChange(snippet.code);
                      setIsSnippetsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs text-[#E6E6E6] hover:bg-[#2C2E33] transition-colors border-b border-[#2C2E33] last:border-0"
                  >
                    {snippet.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2C2E33]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#2C2E33]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#2C2E33]"></div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative border-b border-[#2C2E33]">
         <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => onChange(val || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
            }}
         />
      </div>
      <div className="h-16 p-3 bg-[#0A0A0A] flex items-center justify-between shrink-0">
        <div className="flex gap-4">
          <div className="text-[9px] uppercase font-bold text-[#8E9299] tracking-widest">TOKENS<br/><span className="text-white font-mono text-xs font-normal">{tokenCount}</span></div>
          <div className="text-[9px] uppercase font-bold text-[#8E9299] tracking-widest">CHARS<br/><span className="text-white font-mono text-xs font-normal">{code.length}</span></div>
        </div>
        <button 
          onClick={onPlay}
          className={`flex items-center gap-2 px-6 py-2 rounded text-xs transition-colors tracking-widest font-mono shadow-md ${
            isPlaying
              ? 'bg-transparent border border-[#FF4444] text-[#FF4444] hover:bg-[#FF4444]/10 shadow-[0_0_15px_rgba(255,68,68,0.2)]'
              : 'bg-[#E6E6E6] text-[#0A0A0A] hover:bg-white'
          }`}
        >
          {isPlaying ? (
             <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4h4v12H4V4zm8 0h4v12h-4V4z"></path></svg>
          ) : (
             <svg className="w-4 h-4 ml-[-2px]" fill="currentColor" viewBox="0 0 20 20"><path d="M4.018 14L14.41 8 4.018 2v12z"></path></svg>
          )}
          {isPlaying ? 'STOP SEQ' : 'COMPILE & PLAY'}
        </button>
      </div>
    </>
  );
}
