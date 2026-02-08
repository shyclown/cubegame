import { Move } from './types';
import { WIN_PATTERNS } from './patterns';
import type { GameEngine } from './GameEngine';

export class GameBot {
    private manager: GameEngine;
    private playerId: number;
    private opponentId: number;
    public difficulty: string;
    public maxDepth: number = 3;
    private memo: Map<string, number> = new Map();

    constructor(manager: GameEngine, playerId: number, difficulty: string = 'hard') {
        this.manager = manager;
        this.playerId = playerId;
        this.opponentId = playerId === 1 ? 2 : 1;
        this.difficulty = difficulty;
    }

    private getBoardHash(): string {
        let hash = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const p = this.manager.grid[r][c].element.player;
                if (p) hash += `${r}${c}${p}`;
            }
        }
        return hash;
    }

    public takeTurn(): void {
        this.memo.clear();
        const moves = this.getAvailableMoves(true);
        if (moves.length === 0) return;

        moves.sort((a, b) => {
            const aOff = this.simulatePointCheck(a.r, a.c, this.playerId);
            const aDef = this.simulatePointCheck(a.r, a.c, this.opponentId);
            const bOff = this.simulatePointCheck(b.r, b.c, this.playerId);
            const bDef = this.simulatePointCheck(b.r, b.c, this.opponentId);
            return bOff * 2 + bDef - (aOff * 2 + aDef);
        });

        let bestScore = -Infinity;
        let bestMove = moves[0];

        for (const move of moves) {
            const isStack = !!move.stackTarget;
            let score: number;

            if (isStack) {
                score = this.minimax(this.maxDepth - 1, false, -Infinity, Infinity);
                score += this.simulatePointCheck(move.r, move.c, this.playerId) * 1000;
            } else {
                move.tile.element.placed = true;
                move.tile.element.player = this.playerId;
                score = this.minimax(this.maxDepth - 1, false, -Infinity, Infinity);
                move.tile.element.placed = false;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        if (this.difficulty === 'easy' && moves.length > 1) {
            const pool = moves.slice(0, Math.min(3, moves.length));
            bestMove = pool[Math.floor(Math.random() * pool.length)];
        }

        setTimeout(() => {
            bestMove.tile.highlight();
            this.manager.placeBox(bestMove.stackTarget || null, true);
        }, 600);
    }

    private minimax(depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
        const hash = this.getBoardHash() + depth + isMaximizing;
        if (this.memo.has(hash)) return this.memo.get(hash)!;

        if (depth === 0) return this.evaluateBoard();

        const moves = this.getAvailableMoves();
        if (moves.length === 0) return this.evaluateBoard();

        let result: number;
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                move.tile.element.placed = true;
                move.tile.element.player = this.playerId;
                maxEval = Math.max(maxEval, this.minimax(depth - 1, false, alpha, beta));
                move.tile.element.placed = false;
                alpha = Math.max(alpha, maxEval);
                if (beta <= alpha) break;
            }
            result = maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                move.tile.element.placed = true;
                move.tile.element.player = this.opponentId;
                minEval = Math.min(minEval, this.minimax(depth - 1, true, alpha, beta));
                move.tile.element.placed = false;
                beta = Math.min(beta, minEval);
                if (beta <= alpha) break;
            }
            result = minEval;
        }
        this.memo.set(hash, result);
        return result;
    }

    private evaluateBoard(): number {
        let score = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const tileEl = this.manager.grid[r][c].element;
                if (tileEl.placed) {
                    score += tileEl.player === this.playerId ? 10 : -10;
                } else {
                    const botGain = this.simulatePointCheck(r, c, this.playerId);
                    const plyGain = this.simulatePointCheck(r, c, this.opponentId);
                    if (botGain > 0) score += botGain * 200 + (botGain > 1 ? 1000 : 0);
                    if (plyGain > 0) score -= plyGain * 250 + (plyGain > 1 ? 1200 : 0);
                }
            }
        }
        return score;
    }

    private getAvailableMoves(includeStacks = false): Move[] {
        const moves: Move[] = [];
        const boardEmpty = !this.manager.grid.some((row) => row.some((t) => t.element.placed));
        if (boardEmpty) return [{ r: 4, c: 4, tile: this.manager.grid[4][4] }];

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const tile = this.manager.grid[r][c];
                if (!tile.element.placed && this.hasNeighbor(r, c, 1)) {
                    moves.push({ r, c, tile });
                } else if (
                    includeStacks &&
                    tile.element.placed &&
                    tile.currentCube &&
                    !tile.currentCube.sideElements.top.placed
                ) {
                    const off = this.simulatePointCheck(r, c, this.playerId);
                    const def = this.simulatePointCheck(r, c, this.opponentId);
                    if (off > 0 || def > 0) {
                        moves.push({
                            r,
                            c,
                            tile,
                            stackTarget: tile.currentCube.sideElements.top,
                        });
                    }
                }
            }
        }
        return moves.length > 0 ? moves : this.getAllEmpty();
    }

    private getAllEmpty(): Move[] {
        const moves: Move[] = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (!this.manager.grid[r][c].element.placed) {
                    moves.push({ r, c, tile: this.manager.grid[r][c] });
                }
            }
        }
        return moves;
    }

    private hasNeighbor(r: number, c: number, dist: number): boolean {
        for (let dr = -dist; dr <= dist; dr++) {
            for (let dc = -dist; dc <= dist; dc++) {
                const nR = r + dr,
                    nC = c + dc;
                if (nR >= 0 && nR < 9 && nC >= 0 && nC < 9) {
                    if (this.manager.grid[nR][nC].element.placed) return true;
                }
            }
        }
        return false;
    }

    private simulatePointCheck(row: number, col: number, plyId: number): number {
        let connections = 0;
        WIN_PATTERNS.forEach((p) => {
            const match = p.every((off) => {
                const nR = row + off[0],
                    nC = col + off[1];
                if (nR < 0 || nR >= 9 || nC < 0 || nC >= 9) return false;
                const target = this.manager.grid[nR][nC].element;
                return target.placed && target.player === plyId;
            });
            if (match) connections++;
        });
        return connections;
    }
}
