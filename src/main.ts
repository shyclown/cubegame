class DomUtils {
    static get<T extends HTMLElement>(id: string): T {
        return document.getElementById(id) as T;
    }

    static make(tag: string, className?: string): ExtendedElement {
        const el = document.createElement(tag) as ExtendedElement;
        if (className) el.className = className;
        return el;
    }
}

class GameBot {
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
        const moves = this.getAvailableMoves();
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
            move.tile.element.placed = true;
            move.tile.element.player = this.playerId;
            const score = this.minimax(this.maxDepth - 1, false, -Infinity, Infinity);
            move.tile.element.placed = false;

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        setTimeout(() => {
            bestMove.tile.highlight();
            this.manager.placeBox(null, true);
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

    private getAvailableMoves(): Move[] {
        const moves: Move[] = [];
        const boardEmpty = !this.manager.grid.some((row) => row.some((t) => t.element.placed));
        if (boardEmpty) return [{ r: 4, c: 4, tile: this.manager.grid[4][4] }];

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const tile = this.manager.grid[r][c];
                if (!tile.element.placed && this.hasNeighbor(r, c, 1)) {
                    moves.push({ r, c, tile });
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
        const patterns = [
            [
                [0, -1],
                [0, -2],
            ],
            [
                [0, 1],
                [0, 2],
            ],
            [
                [0, -1],
                [0, 1],
            ],
            [
                [1, 0],
                [2, 0],
            ],
            [
                [-1, 0],
                [-2, 0],
            ],
            [
                [1, 0],
                [-1, 0],
            ],
            [
                [1, 1],
                [2, 2],
            ],
            [
                [-1, -1],
                [-2, -2],
            ],
            [
                [1, 1],
                [-1, -1],
            ],
            [
                [1, -1],
                [2, -2],
            ],
            [
                [-1, 1],
                [-2, 2],
            ],
            [
                [1, -1],
                [-1, 1],
            ],
        ];
        patterns.forEach((p) => {
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

class GameConfig {
    public boxSize = 54;
    public rows = 9;
    public cols = 9;
    public players: Record<number, Player> = {
        1: { name: 'Player One', score: 0, class: 'playerOne' },
        2: { name: 'Player Two', score: 0, class: 'playerTwo' },
    };
    public dom: {
        wrap: HTMLElement;
        game: HTMLElement;
        scoreOne: HTMLElement | null;
        scoreTwo: HTMLElement | null;
        msgBox: HTMLElement;
    };

    constructor() {
        this.dom = {
            wrap: DomUtils.get('gamewrap'),
            game: DomUtils.get('game'),
            scoreOne: DomUtils.get('score-one'),
            scoreTwo: DomUtils.get('score-two'),
            msgBox: DomUtils.get('game-messages'),
        };
    }
}

class Tile {
    public x: number;
    public y: number;
    private manager: GameEngine;
    public currentCube: UserBox | null = null;
    public element: ExtendedElement;

    constructor(x: number, y: number, size: number, manager: GameEngine) {
        this.x = x;
        this.y = y;
        this.manager = manager;
        this.element = DomUtils.make('div', 'square');
        this.element.style.top = `${y * size}px`;
        this.element.style.left = `${x * size}px`;
        this.element.addEventListener('mouseover', () => this.highlight());
        this.manager.config.dom.game.appendChild(this.element);
    }

    public highlight(): void {
        if (this.manager.prevSelectedTile) {
            this.manager.prevSelectedTile.element.style.backgroundImage = 'none';
        }
        this.manager.selected = { x: this.x, y: this.y, tile: this };
        this.element.style.backgroundImage = 'url("glow.png")';
        this.element.style.backgroundSize = 'contain';
        this.element.style.backgroundRepeat = 'no-repeat';
        this.manager.prevSelectedTile = this;
    }
}

class UserBox {
    private manager: GameEngine;
    public el: ExtendedElement;
    public sideElements: Record<string, ExtendedElement> = {};

    constructor(manager: GameEngine) {
        this.manager = manager;
        this.el = DomUtils.make('div', 'cube');
        this.el.classList.add(this.manager.config.players[this.manager.currentPlayer].class);

        const sides = ['top', 'front', 'back', 'left', 'right', 'bottom'];
        sides.forEach((side) => {
            const sideEl = DomUtils.make('div', side);
            this.sideElements[side] = sideEl;
            this.el.appendChild(sideEl);
        });

        this.sideElements.top.addEventListener('click', (e) => {
            e.stopPropagation();
            this.stackCube();
        });
    }

    public flashScored(): void {
        this.el.classList.add('scored');
        setTimeout(() => this.el.classList.remove('scored'), 1000);
    }

    private stackCube(): void {
        if (this.sideElements.top.placed) return;
        this.manager.placeBox(this.sideElements.top);
    }
}

class GameEngine {
    public config: GameConfig;
    public grid: Tile[][] = [];
    public currentPlayer: number = 1;
    public selected: { x: number; y: number; tile: Tile | null } = { x: 0, y: 0, tile: null };
    public prevSelectedTile: Tile | null = null;
    public isProcessing: boolean = false;

    private camera = { degX: 54, degY: -29 };
    private mouse = { x: 0, y: 0 };
    private targetX = 54;
    private targetY = -29;
    private ticking = false;
    private bot: GameBot;

    private _moveRef?: (e: MouseEvent) => void;
    private _upRef?: () => void;

    constructor() {
        this.config = new GameConfig();
        this.bot = new GameBot(this, 2, 'hard');
        this.setupEventListeners();
        this.init();
    }

    private setupEventListeners(): void {
        const diffSelector = DomUtils.get<HTMLSelectElement>('bot-difficulty');
        if (diffSelector) {
            diffSelector.addEventListener('change', (e) => {
                this.bot.difficulty = (e.target as HTMLSelectElement).value;
                this.notify(`Difficulty: ${this.bot.difficulty.toUpperCase()}`);
            });
        }

        const depthSelector = DomUtils.get<HTMLSelectElement>('bot-depth');
        if (depthSelector) {
            depthSelector.addEventListener('change', (e) => {
                this.bot.maxDepth = parseInt((e.target as HTMLSelectElement).value);
                this.notify(`Foresight: ${this.bot.maxDepth} Moves`);
            });
        }
    }

    private init(): void {
        for (let i = 0; i < this.config.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.config.cols; j++) {
                this.grid[i].push(new Tile(j, i, this.config.boxSize, this));
            }
        }
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.config.dom.game.addEventListener('click', () => this.placeBox());
    }

    public notify(text: string, isCombo = false): void {
        const msg = DomUtils.make('div', 'game-notification');
        msg.innerText = text;
        if (isCombo) msg.classList.add('combo-text');
        this.config.dom.msgBox.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }

    public placeBox(targetParent: ExtendedElement | null = null, isBotAction = false): void {
        if (this.isProcessing) return;
        if (this.currentPlayer === 2 && !isBotAction) return;

        const tile = this.selected.tile;
        if (!tile || (targetParent === null && tile.element.placed)) return;

        this.isProcessing = true;
        this.config.dom.game.classList.add('locked');

        const parent = targetParent || tile.element;
        const userB = new UserBox(this);

        parent.appendChild(userB.el);
        parent.placed = true;
        parent.player = this.currentPlayer;

        if (!targetParent) tile.currentCube = userB;

        const winners = this.checkPoints();
        if (winners.length > 0) {
            this.notify(winners.length / 2 > 1 ? 'COMBO!' : '+1 Point!');
        }

        userB.el.style.transform = 'translateZ(200px) rotateX(-90deg) translateZ(-52px)';

        setTimeout(() => {
            userB.el.style.transform = '';
            if (winners.length > 0) {
                userB.flashScored();
                winners.forEach((t) => t.currentCube?.flashScored());
            }
            this.switchPlayer();
            this.isProcessing = false;
            this.config.dom.game.classList.remove('locked');
        }, 200);
    }

    private checkPoints(): Tile[] {
        const { x: col, y: row } = this.selected;
        const ply = this.currentPlayer;
        const contributors: Tile[] = [];

        const getTile = (r: number, c: number): Tile | null => {
            const nR = row + r,
                nC = col + c;
            if (nR < 0 || nR >= this.config.rows || nC < 0 || nC >= this.config.cols) return null;
            const t = this.grid[nR][nC];
            return t.element.placed && t.element.player === ply ? t : null;
        };

        const patterns = [
            [
                [0, -1],
                [0, -2],
            ],
            [
                [0, 1],
                [0, 2],
            ],
            [
                [1, 0],
                [2, 0],
            ],
            [
                [-1, 0],
                [-2, 0],
            ],
            [
                [1, 1],
                [2, 2],
            ],
            [
                [-1, -1],
                [-2, -2],
            ],
            [
                [1, -1],
                [2, -2],
            ],
            [
                [-1, 1],
                [-2, 2],
            ],
            [
                [0, -1],
                [0, 1],
            ],
            [
                [1, 0],
                [-1, 0],
            ],
        ];

        patterns.forEach((p) => {
            const t1 = getTile(p[0][0], p[0][1]);
            const t2 = getTile(p[1][0], p[1][1]);
            if (t1 && t2) {
                contributors.push(t1, t2);
                this.config.players[ply].score++;
            }
        });

        this.updateUI();
        return contributors;
    }

    private updateUI(): void {
        if (this.config.dom.scoreOne)
            this.config.dom.scoreOne.innerHTML = String(this.config.players[1].score);
        if (this.config.dom.scoreTwo)
            this.config.dom.scoreTwo.innerHTML = String(this.config.players[2].score);
    }

    private switchPlayer(): void {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        if (this.currentPlayer === 2) {
            this.config.dom.game.classList.add('locked');
            this.bot.takeTurn();
        } else {
            this.config.dom.game.classList.remove('locked');
        }
    }

    private onMouseDown(e: MouseEvent): void {
        if (e.button === 1) {
            // Middle click
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this._moveRef = (ev) => this.handleMouseMove(ev);
            this._upRef = () => this.stopCamera();
            window.addEventListener('mousemove', this._moveRef);
            window.addEventListener('mouseup', this._upRef);
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        this.targetX = Math.min(Math.max(this.camera.degX + (this.mouse.y - e.clientY), 0), 85);
        this.targetY = this.camera.degY + (this.mouse.x - e.clientX);
        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.config.dom.wrap.style.transform = `rotateX(${this.targetX}deg) rotateZ(${this.targetY}deg)`;
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    private stopCamera(): void {
        if (this._moveRef) window.removeEventListener('mousemove', this._moveRef);
        if (this._upRef) window.removeEventListener('mouseup', this._upRef);
        this.camera.degX = this.targetX;
        this.camera.degY = this.targetY;
    }
}

// Global Init
const app = new GameEngine();
