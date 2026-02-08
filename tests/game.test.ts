import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WIN_PATTERNS } from '../src/patterns';
import { GameEngine } from '../src/GameEngine';

function setupDOM(): void {
    document.body.innerHTML = `
        <div id="gamewrap">
            <div id="game"></div>
        </div>
        <div id="score-one">0</div>
        <div id="score-two">0</div>
        <div id="game-messages"></div>
        <select id="bot-difficulty"></select>
        <button id="reset-game"></button>
        <select id="bot-depth"></select>
    `;
}

function placePiece(engine: GameEngine, row: number, col: number, player: number): void {
    engine.currentPlayer = player;
    engine.isProcessing = false;
    engine.config.dom.game.classList.remove('locked');
    engine.grid[row][col].highlight();
    engine.placeBox(null, player === 2);
    vi.advanceTimersByTime(200);
    vi.clearAllTimers();
}

function stackPiece(engine: GameEngine, row: number, col: number, player: number): void {
    engine.currentPlayer = player;
    engine.isProcessing = false;
    engine.config.dom.game.classList.remove('locked');
    const tile = engine.grid[row][col];
    tile.highlight();
    const topSide = tile.currentCube!.sideElements.top;
    engine.placeBox(topSide, player === 2);
    vi.advanceTimersByTime(200);
    vi.clearAllTimers();
}

function score(engine: GameEngine, player: number): number {
    return engine.config.players[player].score;
}

describe('WIN_PATTERNS structure', () => {
    it('every pattern has exactly 2 offsets with 3 numbers each', () => {
        WIN_PATTERNS.forEach((pattern, i) => {
            expect(pattern, `pattern[${i}] should have 2 offsets`).toHaveLength(2);
            pattern.forEach((offset, j) => {
                expect(offset, `pattern[${i}][${j}] should have 3 values`).toHaveLength(3);
                offset.forEach((val) => {
                    expect(typeof val).toBe('number');
                });
            });
        });
    });

    it('contains 2D patterns (dl=0)', () => {
        const flat = WIN_PATTERNS.filter((p) => p[0][2] === 0 && p[1][2] === 0);
        expect(flat.length).toBe(12);
    });

    it('contains 3D patterns (dl!=0)', () => {
        const spatial = WIN_PATTERNS.filter((p) => p[0][2] !== 0 || p[1][2] !== 0);
        expect(spatial.length).toBe(27);
    });
});

describe('Same-layer scoring', () => {
    let engine: GameEngine;

    beforeEach(() => {
        vi.useFakeTimers();
        setupDOM();
        engine = new GameEngine();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('awards a point for 3 in a row horizontally', () => {
        placePiece(engine, 4, 3, 1);
        placePiece(engine, 4, 4, 1);
        expect(score(engine, 1)).toBe(0);

        placePiece(engine, 4, 5, 1);
        expect(score(engine, 1)).toBe(1);
    });

    it('awards a point for 3 in a column vertically', () => {
        placePiece(engine, 3, 4, 1);
        placePiece(engine, 4, 4, 1);
        expect(score(engine, 1)).toBe(0);

        placePiece(engine, 5, 4, 1);
        expect(score(engine, 1)).toBe(1);
    });

    it('awards a point for 3 in a diagonal', () => {
        placePiece(engine, 3, 3, 1);
        placePiece(engine, 4, 4, 1);
        expect(score(engine, 1)).toBe(0);

        placePiece(engine, 5, 5, 1);
        expect(score(engine, 1)).toBe(1);
    });

    it('does not award points for mixed players', () => {
        placePiece(engine, 4, 3, 1);
        placePiece(engine, 4, 4, 2);
        placePiece(engine, 4, 5, 1);
        expect(score(engine, 1)).toBe(0);
        expect(score(engine, 2)).toBe(0);
    });
});

describe('Cross-layer does NOT score', () => {
    let engine: GameEngine;

    beforeEach(() => {
        vi.useFakeTimers();
        setupDOM();
        engine = new GameEngine();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('stacking on a completed row does not award extra points', () => {
        // Layer 0: three in a row
        placePiece(engine, 4, 3, 1);
        placePiece(engine, 4, 4, 1);
        placePiece(engine, 4, 5, 1);
        expect(score(engine, 1)).toBe(1);

        // Stack on one tile — layer 1 only has one piece, should not score
        stackPiece(engine, 4, 5, 1);
        expect(score(engine, 1)).toBe(1);
    });
});

describe('Vertical stack scoring', () => {
    let engine: GameEngine;

    beforeEach(() => {
        vi.useFakeTimers();
        setupDOM();
        engine = new GameEngine();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('awards a point for 3 same-player cubes stacked on one tile', () => {
        placePiece(engine, 4, 4, 1);
        expect(score(engine, 1)).toBe(0);

        stackPiece(engine, 4, 4, 1);
        expect(score(engine, 1)).toBe(0);

        stackPiece(engine, 4, 4, 1);
        expect(score(engine, 1)).toBe(1);
    });

    it('does not award a point if stacked by different players', () => {
        placePiece(engine, 4, 4, 1);
        stackPiece(engine, 4, 4, 2);
        stackPiece(engine, 4, 4, 1);
        expect(score(engine, 1)).toBe(0);
        expect(score(engine, 2)).toBe(0);
    });
});

describe('3D diagonal scoring', () => {
    let engine: GameEngine;

    beforeEach(() => {
        vi.useFakeTimers();
        setupDOM();
        engine = new GameEngine();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('awards a point for a 3D diagonal (row+col+layer)', () => {
        // Set up layers — use player 2 as filler for lower layers
        placePiece(engine, 4, 4, 2); // (4,4) layer 0 — filler
        stackPiece(engine, 4, 4, 1); // (4,4) layer 1 — player 1

        placePiece(engine, 5, 5, 2); // (5,5) layer 0 — filler
        stackPiece(engine, 5, 5, 2); // (5,5) layer 1 — filler
        stackPiece(engine, 5, 5, 1); // (5,5) layer 2 — player 1

        const scoreBefore = score(engine, 1);

        // Place the final piece that completes the 3D diagonal
        placePiece(engine, 3, 3, 1); // (3,3) layer 0 — player 1
        // Pattern [[1,1,1],[2,2,2]] from (3,3) L0 → (4,4) L1 + (5,5) L2 = player 1
        expect(score(engine, 1)).toBe(scoreBefore + 1);
    });
});

describe('Layer limit', () => {
    let engine: GameEngine;

    beforeEach(() => {
        vi.useFakeTimers();
        setupDOM();
        engine = new GameEngine();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('allows up to 3 layers on a tile', () => {
        placePiece(engine, 4, 4, 1);
        stackPiece(engine, 4, 4, 1);
        stackPiece(engine, 4, 4, 1);
        expect(engine.grid[4][4].layers.length).toBe(3);
    });

    it('blocks a 4th layer from being placed', () => {
        placePiece(engine, 4, 4, 1);
        stackPiece(engine, 4, 4, 1);
        stackPiece(engine, 4, 4, 1);

        // Attempt 4th layer
        engine.currentPlayer = 1;
        engine.isProcessing = false;
        engine.config.dom.game.classList.remove('locked');
        engine.grid[4][4].highlight();
        const topSide = engine.grid[4][4].currentCube!.sideElements.top;
        engine.placeBox(topSide);

        expect(engine.grid[4][4].layers.length).toBe(3);
    });
});

describe('Combo scoring', () => {
    let engine: GameEngine;

    beforeEach(() => {
        vi.useFakeTimers();
        setupDOM();
        engine = new GameEngine();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('awards multiple points when one placement completes multiple patterns', () => {
        // Set up a cross: pieces at (4,3), (4,5), (3,4), (5,4)
        placePiece(engine, 4, 3, 1);
        placePiece(engine, 4, 5, 1);
        placePiece(engine, 3, 4, 1);
        placePiece(engine, 5, 4, 1);
        expect(score(engine, 1)).toBe(0);

        // Place at center (4,4) — completes horizontal AND vertical 3-in-a-row
        placePiece(engine, 4, 4, 1);
        expect(score(engine, 1)).toBe(2);
    });
});

describe('Game reset', () => {
    let engine: GameEngine;

    beforeEach(() => {
        vi.useFakeTimers();
        setupDOM();
        engine = new GameEngine();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resets scores and grid after scoring', () => {
        placePiece(engine, 4, 3, 1);
        placePiece(engine, 4, 4, 1);
        placePiece(engine, 4, 5, 1);
        expect(score(engine, 1)).toBe(1);

        engine.reset();
        vi.clearAllTimers();

        expect(score(engine, 1)).toBe(0);
        expect(score(engine, 2)).toBe(0);
        expect(engine.grid[4][4].element.placed).toBeFalsy();
        expect(engine.grid[4][4].layers.length).toBe(0);
    });
});
