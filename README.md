# Piskvorky - 3D Tic-Tac-Toe Game

A strategic 3D tic-tac-toe game built with TypeScript featuring an intelligent AI opponent and interactive 3D visualization.

## Overview

Piskvorky (Czech for "Five in a Row") is a browser-based strategy game where you compete against an AI bot on a 9x9 grid. The game features 3D cube visualizations using CSS transforms and an intelligent bot powered by the minimax algorithm with alpha-beta pruning.

## Features

- **3D Interactive Board**: Cube-based game board rendered with CSS 3D transforms
- **Smart AI Opponent**: Bot using minimax algorithm with alpha-beta pruning and memoization
- **Adjustable Difficulty**: Easy mode (random moves) and Hard mode (strategic play) with configurable search depth (1-4 moves ahead)
- **Camera Controls**: Middle-click and drag to rotate the board view
- **Score Tracking**: Real-time score display for both players
- **Combo Detection**: Bonus points for multiple winning patterns in a single move
- **Stacking**: Place cubes on top of existing ones for 3D layer gameplay
- **39 Win Patterns**: Horizontal, vertical, diagonal, and cross-layer 3-in-a-row patterns

## How to Play

1. **Place a Cube** - Click any empty square on the 9x9 grid
2. **Stack Cubes** - Click the top of an existing cube to stack another layer
3. **Rotate View** - Middle-click and drag to orbit the camera
4. **Adjust Difficulty** - Use the dropdown selectors for bot difficulty and search depth
5. **Score Points** - Complete patterns of 3 in a row (horizontal, vertical, diagonal, or across layers)
6. **Watch for Combos** - A single move completing multiple patterns scores bonus points

The AI bot plays as Player Two and moves automatically after your turn.

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm

### Setup

```bash
git clone https://github.com/shyclown/cubegame.git
cd piskvorky
npm install
```

## Development

```bash
npm run dev       # Start dev server with live reload
npm run build     # Production build to dist/
npm run test      # Run tests (Vitest)
npm run lint      # Lint TypeScript with ESLint
npm run format    # Format code with Prettier
npm run stylelint # Lint CSS with Stylelint
npm run deploy    # Build and deploy to GitHub Pages
```

## Project Structure

```
src/
├── main.ts           # Entry point - creates GameEngine instance
├── GameEngine.ts     # Core game controller: state, turns, scoring, camera
├── GameBot.ts        # AI opponent: minimax with alpha-beta pruning
├── Tile.ts           # Grid square: hover, highlight, cube management
├── UserBox.ts        # 3D cube element: rendering, stacking, animations
├── GameConfig.ts     # DOM references and player configuration
├── DomUtils.ts       # DOM helper utilities
├── patterns.ts       # WIN_PATTERNS constant (39 three-in-a-row patterns)
├── types.ts          # TypeScript interfaces (ExtendedElement, Move, Player)
├── index.html        # HTML structure
├── styles/
│   ├── game.css      # Game board and layout styling
│   ├── cube.css      # 3D cube transforms and animations
│   └── ui.css        # Controls and UI styling
└── public/           # Texture images (floor, glow, grass, green, side)
tests/
└── game.test.ts      # Game engine tests (Vitest + jsdom)
```

## Architecture

### Core Classes

- **GameEngine** - Central controller: manages 9x9 grid of Tiles, player turns, scoring via pattern matching, camera drag rotation, and bot integration
- **GameBot** - AI player: minimax with alpha-beta pruning, memoized board evaluation, configurable depth, offensive (2x weight) + defensive scoring heuristics
- **Tile** - Grid square: owns its DOM element, handles hover/highlight state, manages a stack of UserBox cubes
- **UserBox** - 3D cube: six-sided CSS 3D element with drop animation and player-specific textures
- **GameConfig** - Holds DOM element references and player data (names, scores, CSS classes)
- **DomUtils** - Static helpers for DOM queries and element creation

### Win Pattern System

39 patterns check for three-in-a-row:
- 12 same-layer patterns (horizontal, vertical, diagonal within a single layer)
- 27 cross-layer patterns (combinations spanning stacked cube layers)

Each pattern is defined as relative offsets from a placed position. Multiple pattern matches on a single move trigger combo scoring.

### AI Strategy

The bot evaluates moves by:
1. Pre-sorting candidate moves by combined offensive (2x weight) + defensive value
2. Running minimax with alpha-beta pruning to the configured depth
3. Caching board state evaluations via memoization for performance

## Technologies

- **TypeScript** - Type-safe game logic
- **Rollup** - Bundler with TypeScript compilation, live reload, dev server, and asset copying
- **Vitest** - Test runner with jsdom environment
- **CSS 3D Transforms** - Board and cube rendering
- **GitHub Pages** - Deployment target

## License

ISC

## Author

Created by shyclown
