# SONIFYSYS (SonifyCode)

Turn your code into music! SONIFYSYS is an interactive web application that parses your source code and translates it into dynamic musical sequences using Tone.js and Shiki.

## Features

- **Advanced Code Parsing**: Powered by [Shiki](https://shiki.style/), the same engine running under VS Code, it analyzes code tokens with absolute precision, mapping keywords, variables, primitives, and punctuation to specific musical elements.
- **Auto Language Detection**: Uses [Flourite](https://github.com/shikijs/shiki/tree/main/packages/flourite) to instantly detect the programming language of your snippets.
- **Multiple Synth Presets**:
  - `C-01 FM BASE`: Classic FM Synthesis
  - `S-02 SAW DELAY`: Synthwave vibe with sawtooth waves and delay
  - `A-03 REVERB SQ`: Lush Ambient landscapes with intense reverb
  - `R-04 8BIT PULSE`: Retro 8-bit pulse/square waves
- **Export Capabilities**:
  - **MIDI Export**: Export the generated notes as standard `.mid` sequence files.
  - **Audio Bounce**: Render the sequence directly to an offline `.wav` file.
- **Real-time Visualizer**: Watch the abstract syntax tree and token streams materialize as visuals synchronized with the playback.

## How it works

The internal engine performs sequential parsing and mapping:
1. Identify the language.
2. Tokenize the script line-by-line via TextMate grammars.
3. Map tokens dynamically:
   - **Keywords**: Map to Chords.
   - **Numbers**: Map to Kicks.
   - **Strings / Variables**: Map to Melodic notes across predefined scales using token-hashing.
   - **Punctuation**: Map to Hi-hats and percussive tops.
4. Schedule everything precisely on `Tone.Transport`.

## Development

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build
```

## Technologies Used

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tone.js](https://tonejs.github.io/)
- [Shiki](https://shiki.style/) 
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

## License

MIT
