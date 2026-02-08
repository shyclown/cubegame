import { ExtendedElement } from './types';
import { DomUtils } from './DomUtils';
import { WIN_PATTERNS } from './patterns';
import { GameConfig } from './GameConfig';
import { Tile } from './Tile';
import { UserBox } from './UserBox';
import { GameBot } from './GameBot';

export class GameEngine {
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
    private _mouseDownRef: (e: MouseEvent) => void;
    private _gameClickRef: () => void;

    constructor() {
        this.config = new GameConfig();
        this.bot = new GameBot(this, 2, 'hard');
        this._mouseDownRef = (e) => this.onMouseDown(e);
        this._gameClickRef = () => this.placeBox();
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

        const resetBtn = DomUtils.get<HTMLButtonElement>('reset-game');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        const depthSelector = DomUtils.get<HTMLSelectElement>('bot-depth');
        if (depthSelector) {
            depthSelector.addEventListener('change', (e) => {
                this.bot.maxDepth = parseInt((e.target as HTMLSelectElement).value);
                this.notify(`Foresight: ${this.bot.maxDepth} Moves`);
            });
        }

        document.addEventListener('mousedown', this._mouseDownRef);
        this.config.dom.game.addEventListener('click', this._gameClickRef);
    }

    private init(): void {
        for (let i = 0; i < this.config.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.config.cols; j++) {
                this.grid[i].push(new Tile(j, i, this.config.boxSize, this));
            }
        }
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
        if (targetParent !== null && tile.layers.length >= 3) return;

        this.isProcessing = true;
        this.config.dom.game.classList.add('locked');

        const parent = targetParent || tile.element;
        const userB = new UserBox(this);

        parent.appendChild(userB.el);
        parent.placed = true;
        parent.player = this.currentPlayer;

        tile.currentCube = userB;
        tile.layers.push({ player: this.currentPlayer, cube: userB });
        const layer = tile.layers.length - 1;

        const winners = this.checkPoints(layer);
        if (winners.length > 0) {
            this.notify(winners.length / 2 > 1 ? 'COMBO!' : '+1 Point!');
        }

        userB.el.style.transform = 'translateZ(200px) rotateX(-90deg) translateZ(-52px)';

        setTimeout(() => {
            userB.el.style.transform = '';
            if (winners.length > 0) {
                userB.flashScored();
                winners.forEach((cube) => cube.flashScored());
            }
            this.isProcessing = false;
            if (this.isBoardFull()) {
                this.announceGameOver();
            } else {
                this.switchPlayer();
                this.config.dom.game.classList.remove('locked');
            }
        }, 200);
    }

    private isBoardFull(): boolean {
        return this.grid.every((row) => row.every((t) => t.element.placed));
    }

    private announceGameOver(): void {
        const s1 = this.config.players[1].score;
        const s2 = this.config.players[2].score;
        if (s1 > s2) {
            this.notify('Game Over — Player One Wins!');
        } else if (s2 > s1) {
            this.notify('Game Over — Player Two Wins!');
        } else {
            this.notify('Game Over — Draw!');
        }
        this.config.dom.game.classList.add('locked');
    }

    private checkPoints(layer: number): UserBox[] {
        const { x: col, y: row } = this.selected;
        const ply = this.currentPlayer;
        const contributors: UserBox[] = [];

        const getCube = (r: number, c: number, dl: number): UserBox | null => {
            const nR = row + r,
                nC = col + c,
                nL = layer + dl;
            if (nR < 0 || nR >= this.config.rows || nC < 0 || nC >= this.config.cols) return null;
            if (nL < 0 || nL >= 3) return null;
            const t = this.grid[nR][nC];
            const tileLayer = t.layers[nL];
            return tileLayer && tileLayer.player === ply ? tileLayer.cube : null;
        };

        WIN_PATTERNS.forEach((p) => {
            const c1 = getCube(p[0][0], p[0][1], p[0][2]);
            const c2 = getCube(p[1][0], p[1][1], p[1][2]);
            if (c1 && c2) {
                contributors.push(c1, c2);
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

    public reset(): void {
        this.config.dom.game.innerHTML = '';
        this.grid = [];
        for (let i = 0; i < this.config.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.config.cols; j++) {
                this.grid[i].push(new Tile(j, i, this.config.boxSize, this));
            }
        }
        this.config.players[1].score = 0;
        this.config.players[2].score = 0;
        this.currentPlayer = 1;
        this.isProcessing = false;
        this.prevSelectedTile = null;
        this.selected = { x: 0, y: 0, tile: null };
        this.config.dom.game.classList.remove('locked');
        this.updateUI();
        this.notify('Game Reset!');
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
