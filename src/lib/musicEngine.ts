import * as Tone from 'tone';
import MidiWriter from 'midi-writer-js';
import { MusicEvent } from './types';
import { StyleId, SynthSetup, createSynthSetup, connectSynths, disposeSynths } from './toneStyles';

let mainSynths: SynthSetup | null = null;

let tonePart: Tone.Part | null = null;
let currentStyle: StyleId = 'classic';
let isInitializing = false;

export async function initEngine(style: StyleId = 'classic') {
  await Tone.start();
  
  if (mainSynths && currentStyle === style) {
     return;
  }
  
  if (isInitializing) {
     while (isInitializing) {
        await new Promise(r => setTimeout(r, 50));
     }
     return;
  }
  
  isInitializing = true;
  try {
    if (mainSynths) {
       disposeSynths(mainSynths);
    }

    mainSynths = createSynthSetup(style);
    connectSynths(mainSynths, Tone.getDestination());
    currentStyle = style;
    
    Tone.Transport.bpm.value = 120;
  } finally {
    isInitializing = false;
  }
}

export async function playSequence(events: MusicEvent[], onNotePlayed: (evt: MusicEvent) => void, onComplete: () => void, loop = false, style: StyleId = 'classic') {
  stopPlayback();
  await initEngine(style);
  
  tonePart = new Tone.Part((time, value) => {
    if (!mainSynths) return;
    const event = value as unknown as MusicEvent;
    
    Tone.Draw.schedule(() => {
      onNotePlayed(event);
    }, time);

    if (event.type === 'chord') {
      mainSynths.poly.triggerAttackRelease(event.notes, event.duration, time);
    } else if (event.type === 'melody') {
      mainSynths.melody.triggerAttackRelease(event.notes as string, event.duration, time);
    } else if (event.type === 'kick') {
      mainSynths.kick.triggerAttackRelease(event.notes as string, event.duration, time);
    } else if (event.type === 'hat') {
      mainSynths.hat.triggerAttackRelease(event.duration, time);
    }
  }, events.map(e => [e.time, e]));

  tonePart.start(0);
  
  const endTime = events.length > 0 ? events[events.length - 1].time + 1 : 0;
  
  if (loop) {
    tonePart.loop = true;
    tonePart.loopEnd = endTime;
  }
  
  Tone.Transport.start();
  
  if (!loop) {
    Tone.Transport.scheduleOnce((time) => {
      Tone.Draw.schedule(() => {
        onComplete();
      }, time);
    }, endTime);
  }
}

export function stopPlayback() {
  if (tonePart) {
    tonePart.dispose();
    tonePart = null;
  }
  Tone.Transport.stop();
  Tone.Transport.position = 0;
  Tone.Transport.cancel(0); 
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(offset, data, true);
    offset += 2;
  }

  function setUint32(data: number) {
    view.setUint32(offset, data, true);
    offset += 4;
  }

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for(i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while(pos < buffer.length) {
    for(i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][pos]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0;
        view.setInt16(offset, sample, true); 
        offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArray], { type: "audio/wav" });
}

export async function exportToOfflineWav(events: MusicEvent[], style: StyleId = 'classic'): Promise<string> {
  if (events.length === 0) return "";
  const maxTime = events[events.length - 1].time + 2; 

  const buffer = await Tone.Offline(({ transport, destination }) => {
    const setup = createSynthSetup(style);
    connectSynths(setup, destination);

    const part = new Tone.Part((time, value) => {
      const event = value as unknown as MusicEvent;
      if (event.type === 'chord') {
        setup.poly.triggerAttackRelease(event.notes, event.duration, time);
      } else if (event.type === 'melody') {
        setup.melody.triggerAttackRelease(event.notes as string, event.duration, time);
      } else if (event.type === 'kick') {
        setup.kick.triggerAttackRelease('C1', event.duration, time);
      } else if (event.type === 'hat') {
        setup.hat.triggerAttackRelease('32n', time, 0.3);
      }
    }, events.map(e => ({ time: e.time, notes: e.notes, duration: e.duration, type: e.type })));

    part.start(0);
    transport.bpm.value = 120;
    transport.start(0);
  }, maxTime);

  const wavBlob = audioBufferToWav(buffer.get());
  return URL.createObjectURL(wavBlob);
}

export function exportToMidi(events: MusicEvent[]): string {
  const track = new MidiWriter.Track();
  track.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 1})); 
  
  const drumTrack = new MidiWriter.Track();
  drumTrack.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 115})); 

  events.forEach(evt => {
    const tickTime = Math.round(evt.time * 256);
    
    let durTicks = 64; 
    if (evt.duration === '4n') durTicks = 128;
    if (evt.duration === '16n') durTicks = 32;

    const midiNotes = Array.isArray(evt.notes) ? evt.notes : [evt.notes];
    
    if (evt.type === 'kick' || evt.type === 'hat') {
       const note = evt.type === 'kick' ? 'C2' : 'Gb2'; 
       const noteEvent = new MidiWriter.NoteEvent({
        pitch: [note],
        duration: `T${durTicks}`,
        tick: tickTime,
        channel: 10
      });
      drumTrack.addEvent(noteEvent);
    } else {
      const noteEvent = new MidiWriter.NoteEvent({
        pitch: midiNotes,
        duration: `T${durTicks}`,
        tick: tickTime
      });
      track.addEvent(noteEvent);
    }
  });

  const write = new MidiWriter.Writer([track, drumTrack]);
  return write.dataUri();
}
