# Piskvorky - 3D Tic-Tac-Toe Game

A strategic 3D tic-tac-toe game built with TypeScript featuring an intelligent AI opponent and interactive 3D visualization.

## Overview

Piskvorky (Czech for "Five in a Row") is a browser-based strategy game where you compete against an AI bot on a 9x9 grid. The game features stunning 3D cube visualizations using CSS transforms and an intelligent bot powered by the minimax algorithm with alpha-beta pruning.

## Features

- **3D Interactive Board**: Beautiful 3D cube-based game board with CSS transforms
- **Smart AI Opponent**: Challenging bot using minimax algorithm with configurable difficulty
- **Adjustable Difficulty**:
  - Easy mode (random-ish moves)
  - Hard mode (strategic play)
  - Configurable foresight depth (1-4 moves ahead)
- **Camera Controls**: Rotate the board view using middle-click and drag
- **Score Tracking**: Real-time score updates for both players
- **Combo Detection**: Earn bonus points for multiple winning patterns in a single move
- **Smooth Animations**: Cube placement animations and visual feedback

## Game Rules

The objective is to create patterns of 3 cubes in a row on the 9x9 grid. You score points by:
- Placing a cube that completes a pattern of 3 in a row
- Patterns can be horizontal, vertical, or diagonal
- Multiple patterns from a single placement earn combo bonuses

The AI bot takes Player Two and will automatically make moves after your turn.

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/shyclown/cubegame.git
cd piskvorky
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode

Run the development server with hot reload:
```bash
npm run dev
```

This will:
- Start a local server at `http://localhost:3000`
- Automatically open your browser
- Watch for file changes and reload

### Production Build

Build the project for production:
```bash
npm run build
```

The compiled files will be in the `dist/` directory.

### Deploy to GitHub Pages

Deploy your game to GitHub Pages:
```bash
npm run deploy
```

## How to Play

1. **Place a Cube**: Click on any empty square to place your cube
2. **Stack Cubes**: Click on the top of an existing cube to stack another cube on it
3. **Rotate View**: Middle-click and drag to rotate the camera and view the board from different angles
4. **Adjust Difficulty**: Use the controls to change the bot's difficulty and foresight depth
5. **Score Points**: Create patterns of 3 in a row to score points
6. **Watch for Combos**: A single move can create multiple patterns for bonus points

## Project Structure

```
piskvorky/
├── src/
│   ├── main.ts           # Main game logic and classes
│   ├── types.ts          # TypeScript type definitions
│   ├── index.html        # HTML structure
│   ├── styles/
│   │   ├── game.css      # Game board styling
│   │   ├── cube.css      # 3D cube styling
│   │   └── ui.css        # UI and controls styling
│   └── public/
│       └── *.jpg         # Texture images
├── dist/                 # Compiled output (generated)
├── rollup.config.mjs     # Rollup bundler configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## Technologies Used

- **TypeScript**: Type-safe game logic
- **Rollup**: Module bundler with plugins for:
  - TypeScript compilation
  - Live reload
  - Local development server
  - Asset copying
- **CSS3**: 3D transforms and animations
- **Minimax Algorithm**: AI decision making with alpha-beta pruning
- **GitHub Pages**: Deployment platform

## Game Architecture

### Core Classes

- **GameEngine**: Main game controller managing game state, player turns, and board updates
- **GameBot**: AI opponent implementing minimax algorithm with strategic move evaluation
- **Tile**: Represents each square on the 9x9 grid
- **UserBox**: 3D cube element with placement and stacking logic
- **GameConfig**: Game configuration and DOM references

### AI Strategy

The bot uses:
- **Minimax algorithm** with alpha-beta pruning for efficient decision trees
- **Position evaluation** based on:
  - Offensive opportunities (completing patterns)
  - Defensive needs (blocking opponent patterns)
  - Strategic positioning (weighted scoring)
- **Memoization** to cache evaluated board states
- **Smart move filtering** to prioritize moves near existing pieces

## Development Scripts

- `npm run dev` - Start development server with watch mode
- `npm run build` - Build for production
- `npm run watch` - Watch mode without server
- `npm run deploy` - Deploy to GitHub Pages

## License

ISC

## Author

Created by shyclown

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
