import { codeToTokens } from 'shiki';
import flourite from 'flourite';
import { MusicEvent } from './types';
import { CHORDS, MELODY_SCALE } from './constants';

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export async function parseCodeToEvents(code: string, preferredLang?: string): Promise<{ events: MusicEvent[], language: string }> {
  let language = preferredLang;
  
  if (!language) {
    const detect = flourite(code, { shiki: true });
    language = detect.language || 'text';
  }

  let tokensOutput;
  try {
    tokensOutput = await codeToTokens(code, {
      lang: language as any,
      theme: 'vitesse-dark',
      includeExplanation: true
    });
  } catch (e) {
    tokensOutput = await codeToTokens(code, {
      lang: 'text',
      theme: 'vitesse-dark',
      includeExplanation: true
    });
    language = 'text';
  }

  const { tokens } = tokensOutput;

  const events: MusicEvent[] = [];
  let currentTime = 0;
  let chordIndex = 0;
  
  // Flatten lines into a single sequence
  for (const line of tokens) {
    for (const token of line) {
      const text = token.content;
      if (text.trim().length === 0) {
        continue;
      }
      
      let isKeyword = false;
      let isNumber = false;
      let isString = false;
      let isPunctuation = false;
      
      if (token.explanation && token.explanation.length > 0) {
        const scopes = token.explanation[0].scopes;
        for (const scopeObj of scopes) {
          const scope = scopeObj.scopeName;
          if (scope.includes('keyword') || scope.includes('storage') || scope.includes('type') || scope.includes('entity.name')) {
            isKeyword = true;
          }
          if (scope.includes('constant.numeric')) {
            isNumber = true;
          }
          if (scope.includes('string')) {
            isString = true;
          }
          if (scope.includes('punctuation')) {
            isPunctuation = true;
          }
        }
      }

      let evType: 'chord'|'melody'|'kick'|'hat' = 'melody';
      let notes: string | string[] = 'C4';
      let duration: string = '8n';
      let durationVal = 0.25;

      if (isKeyword) {
          evType = 'chord';
          notes = CHORDS[chordIndex % CHORDS.length];
          duration = '4n';
          durationVal = 0.5;
          chordIndex++;
      } else if (isNumber) {
          evType = 'kick';
          notes = 'C1';
          duration = '8n';
          durationVal = 0.25;
      } else if (isString) {
          evType = 'melody';
          notes = MELODY_SCALE[(stringHash(text) + 2) % MELODY_SCALE.length];
          duration = '16n';
          durationVal = 0.125;
      } else if (isPunctuation || /^[^\w\s]$/.test(text.trim())) {
          if ([';', '.', ',', '{', '}', '(', ')'].includes(text.trim())) {
              evType = 'hat';
              duration = '16n';
              durationVal = 0.125;
          } else {
              evType = 'melody';
              notes = MELODY_SCALE[stringHash(text) % MELODY_SCALE.length];
              duration = '16n';
              durationVal = 0.125;
          }
      } else {
          evType = 'melody';
          const hash = stringHash(text);
          let note = MELODY_SCALE[hash % MELODY_SCALE.length];
          if (text.length > 5) {
            note = note.replace('5', '6').replace('4', '5');
          }
          notes = note;
      }

      events.push({
          type: evType,
          notes,
          duration,
          time: currentTime,
          token: text,
          index: events.length,
          charIndex: token.offset
      });

      currentTime += durationVal;
    }
  }

  return { events, language };
}
