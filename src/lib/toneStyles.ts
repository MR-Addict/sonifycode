import * as Tone from 'tone';

export type StyleId = 'classic' | 'ambient' | 'synthwave' | 'retro';

export interface SynthSetup {
  poly: Tone.PolySynth;
  melody: any;
  kick: Tone.MembraneSynth;
  hat: Tone.MetalSynth;
  effects: Tone.ToneAudioNode[];
}

export function createSynthSetup(style: StyleId): SynthSetup {
  let poly, melody, kick, hat;
  const effects: Tone.ToneAudioNode[] = [];

  switch (style) {
    case 'ambient': {
      // Lush, reverby, slow attack
      poly = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.5, decay: 1, sustain: 0.8, release: 2 }
      });
      poly.volume.value = -12;

      melody = new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 3,
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.2, decay: 0.5, sustain: 0.4, release: 1.5 }
      });
      melody.volume.value = -10;

      kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.05, decay: 0.4, sustain: 0.1, release: 1 }
      });
      kick.volume.value = -8;

      hat = new Tone.MetalSynth({
        envelope: { attack: 0.01, decay: 0.5, release: 0.5 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      });
      hat.volume.value = -20;

      const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 });
      const chorus = new Tone.Chorus(4, 2.5, 0.5).start();
      effects.push(chorus, reverb);
      break;
    }
    case 'synthwave': {
      // Sawtooth, active, delay
      poly = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.5 }
      });
      poly.volume.value = -14;

      melody = new Tone.AMSynth({
        harmonicity: 1.04,
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 }
      });
      melody.volume.value = -8;

      kick = new Tone.MembraneSynth({
        pitchDecay: 0.02,
        octaves: 6,
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
      });
      kick.volume.value = -5;

      hat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      });
      hat.volume.value = -15;

      const delay = new Tone.PingPongDelay("8n", 0.3);
      const reverb = new Tone.Reverb({ decay: 2, wet: 0.2 });
      effects.push(delay, reverb);
      break;
    }
    case 'retro': {
      // 8-bit style, square/pulse waves, no effects
      poly = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 }
      });
      poly.volume.value = -16;

      melody = new Tone.Synth({
        oscillator: { type: 'pulse', width: 0.2 },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 }
      });
      melody.volume.value = -10;

      kick = new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 2,
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
      });
      kick.volume.value = -6;

      hat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.02, release: 0.01 },
        harmonicity: 3.1,
        resonance: 2000,
      });
      hat.volume.value = -18;
      
      // Retro often has no effects, maybe just a bit of EQ
      break;
    }
    case 'classic':
    default: {
      // The original default
      poly = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.5 }
      });
      poly.volume.value = -12;

      melody = new Tone.FMSynth({
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
      });
      melody.volume.value = -8;

      kick = new Tone.MembraneSynth();
      kick.volume.value = -5;

      hat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      });
      hat.volume.value = -15;
      break;
    }
  }

  return { poly, melody, kick, hat, effects };
}

export function connectSynths(setup: SynthSetup, destination: Tone.ToneAudioNode) {
  if (setup.effects.length > 0) {
    // Chain effects
    let current: Tone.ToneAudioNode = setup.effects[0];
    for (let i = 1; i < setup.effects.length; i++) {
        current.connect(setup.effects[i]);
        current = setup.effects[i];
    }
    current.connect(destination);

    setup.poly.connect(setup.effects[0]);
    setup.melody.connect(setup.effects[0]);
    setup.kick.connect(setup.effects[0]);
    setup.hat.connect(setup.effects[0]);
  } else {
    setup.poly.connect(destination);
    setup.melody.connect(destination);
    setup.kick.connect(destination);
    setup.hat.connect(destination);
  }
}

export function disposeSynths(setup: SynthSetup) {
   setup.poly.dispose();
   setup.melody.dispose();
   setup.kick.dispose();
   setup.hat.dispose();
   setup.effects.forEach(e => e.dispose());
}
