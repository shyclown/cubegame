(function () {
    'use strict';

    class DomUtils {
        static get(id) {
            return document.getElementById(id);
        }
        static make(tag, className) {
            const el = document.createElement(tag);
            if (className)
                el.className = className;
            return el;
        }
    }

    const WIN_PATTERNS = [
        // 2D patterns (same layer)
        // Horizontal
        [[0, -1, 0], [0, -2, 0]],
        [[0, 1, 0], [0, 2, 0]],
        [[0, -1, 0], [0, 1, 0]],
        // Vertical (row)
        [[1, 0, 0], [2, 0, 0]],
        [[-1, 0, 0], [-2, 0, 0]],
        [[1, 0, 0], [-1, 0, 0]],
        // Diagonal
        [[1, 1, 0], [2, 2, 0]],
        [[-1, -1, 0], [-2, -2, 0]],
        [[1, 1, 0], [-1, -1, 0]],
        // Anti-diagonal
        [[1, -1, 0], [2, -2, 0]],
        [[-1, 1, 0], [-2, 2, 0]],
        [[1, -1, 0], [-1, 1, 0]],
        // 3D patterns (with layer changes)
        // Pure vertical stack (same position, different layers)
        [[0, 0, 1], [0, 0, 2]],
        [[0, 0, -1], [0, 0, -2]],
        [[0, 0, -1], [0, 0, 1]],
        // Row + layer
        [[1, 0, 1], [2, 0, 2]],
        [[-1, 0, -1], [-2, 0, -2]],
        [[1, 0, 1], [-1, 0, -1]],
        [[-1, 0, 1], [-2, 0, 2]],
        [[1, 0, -1], [2, 0, -2]],
        [[-1, 0, 1], [1, 0, -1]],
        // Col + layer
        [[0, 1, 1], [0, 2, 2]],
        [[0, -1, -1], [0, -2, -2]],
        [[0, 1, 1], [0, -1, -1]],
        [[0, -1, 1], [0, -2, 2]],
        [[0, 1, -1], [0, 2, -2]],
        [[0, -1, 1], [0, 1, -1]],
        // Diagonal + layer (row+col+layer)
        [[1, 1, 1], [2, 2, 2]],
        [[-1, -1, -1], [-2, -2, -2]],
        [[1, 1, 1], [-1, -1, -1]],
        [[-1, -1, 1], [-2, -2, 2]],
        [[1, 1, -1], [2, 2, -2]],
        [[-1, -1, 1], [1, 1, -1]],
        // Anti-diagonal + layer (row-col+layer)
        [[1, -1, 1], [2, -2, 2]],
        [[-1, 1, -1], [-2, 2, -2]],
        [[1, -1, 1], [-1, 1, -1]],
        [[-1, 1, 1], [-2, 2, 2]],
        [[1, -1, -1], [2, -2, -2]],
        [[-1, 1, 1], [1, -1, -1]],
    ];

    class GameConfig {
        boxSize = 54;
        rows = 9;
        cols = 9;
        players = {
            1: { name: 'Player One', score: 0, class: 'playerOne' },
            2: { name: 'Player Two', score: 0, class: 'playerTwo' },
        };
        dom;
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
        x;
        y;
        manager;
        currentCube = null;
        layers = [];
        element;
        constructor(x, y, size, manager) {
            this.x = x;
            this.y = y;
            this.manager = manager;
            this.element = DomUtils.make('div', 'square');
            this.element.style.top = `${y * size}px`;
            this.element.style.left = `${x * size}px`;
            this.element.addEventListener('mouseover', () => this.highlight());
            this.manager.config.dom.game.appendChild(this.element);
        }
        highlight() {
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
        manager;
        el;
        sideElements = {};
        constructor(manager) {
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
        flashScored() {
            this.el.classList.add('scored');
            setTimeout(() => this.el.classList.remove('scored'), 1000);
        }
        stackCube() {
            if (this.sideElements.top.placed)
                return;
            this.manager.placeBox(this.sideElements.top);
        }
    }

    class GameBot {
        manager;
        playerId;
        opponentId;
        difficulty;
        maxDepth = 3;
        memo = new Map();
        constructor(manager, playerId, difficulty = 'hard') {
            this.manager = manager;
            this.playerId = playerId;
            this.opponentId = playerId === 1 ? 2 : 1;
            this.difficulty = difficulty;
        }
        getBoardHash() {
            let hash = '';
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    const p = this.manager.grid[r][c].element.player;
                    if (p)
                        hash += `${r}${c}${p}`;
                }
            }
            return hash;
        }
        takeTurn() {
            this.memo.clear();
            const moves = this.getAvailableMoves(true);
            if (moves.length === 0)
                return;
            moves.sort((a, b) => {
                const aLayer = a.stackTarget ? a.tile.layers.length : 0;
                const bLayer = b.stackTarget ? b.tile.layers.length : 0;
                const aOff = this.simulatePointCheck(a.r, a.c, this.playerId, aLayer);
                const aDef = this.simulatePointCheck(a.r, a.c, this.opponentId, aLayer);
                const bOff = this.simulatePointCheck(b.r, b.c, this.playerId, bLayer);
                const bDef = this.simulatePointCheck(b.r, b.c, this.opponentId, bLayer);
                return bOff * 2 + bDef - (aOff * 2 + aDef);
            });
            let bestScore = -Infinity;
            let bestMove = moves[0];
            for (const move of moves) {
                const isStack = !!move.stackTarget;
                let score;
                if (isStack) {
                    const stackLayer = move.tile.layers.length;
                    score = this.minimax(this.maxDepth - 1, false, -Infinity, Infinity);
                    score +=
                        this.simulatePointCheck(move.r, move.c, this.playerId, stackLayer) * 1000;
                }
                else {
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
        minimax(depth, isMaximizing, alpha, beta) {
            const hash = this.getBoardHash() + depth + isMaximizing;
            if (this.memo.has(hash))
                return this.memo.get(hash);
            if (depth === 0)
                return this.evaluateBoard();
            const moves = this.getAvailableMoves();
            if (moves.length === 0)
                return this.evaluateBoard();
            let result;
            if (isMaximizing) {
                let maxEval = -Infinity;
                for (const move of moves) {
                    move.tile.element.placed = true;
                    move.tile.element.player = this.playerId;
                    maxEval = Math.max(maxEval, this.minimax(depth - 1, false, alpha, beta));
                    move.tile.element.placed = false;
                    alpha = Math.max(alpha, maxEval);
                    if (beta <= alpha)
                        break;
                }
                result = maxEval;
            }
            else {
                let minEval = Infinity;
                for (const move of moves) {
                    move.tile.element.placed = true;
                    move.tile.element.player = this.opponentId;
                    minEval = Math.min(minEval, this.minimax(depth - 1, true, alpha, beta));
                    move.tile.element.placed = false;
                    beta = Math.min(beta, minEval);
                    if (beta <= alpha)
                        break;
                }
                result = minEval;
            }
            this.memo.set(hash, result);
            return result;
        }
        evaluateBoard() {
            let score = 0;
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    const tileEl = this.manager.grid[r][c].element;
                    if (tileEl.placed) {
                        score += tileEl.player === this.playerId ? 10 : -10;
                    }
                    else {
                        const botGain = this.simulatePointCheck(r, c, this.playerId);
                        const plyGain = this.simulatePointCheck(r, c, this.opponentId);
                        if (botGain > 0)
                            score += botGain * 200 + (botGain > 1 ? 1000 : 0);
                        if (plyGain > 0)
                            score -= plyGain * 250 + (plyGain > 1 ? 1200 : 0);
                    }
                }
            }
            return score;
        }
        getAvailableMoves(includeStacks = false) {
            const moves = [];
            const boardEmpty = !this.manager.grid.some((row) => row.some((t) => t.element.placed));
            if (boardEmpty)
                return [{ r: 4, c: 4, tile: this.manager.grid[4][4] }];
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    const tile = this.manager.grid[r][c];
                    if (!tile.element.placed && this.hasNeighbor(r, c, 1)) {
                        moves.push({ r, c, tile });
                    }
                    else if (includeStacks &&
                        tile.element.placed &&
                        tile.currentCube &&
                        tile.layers.length < 3 &&
                        !tile.currentCube.sideElements.top.placed) {
                        const nextLayer = tile.layers.length;
                        const off = this.simulatePointCheck(r, c, this.playerId, nextLayer);
                        const def = this.simulatePointCheck(r, c, this.opponentId, nextLayer);
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
        getAllEmpty() {
            const moves = [];
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (!this.manager.grid[r][c].element.placed) {
                        moves.push({ r, c, tile: this.manager.grid[r][c] });
                    }
                }
            }
            return moves;
        }
        hasNeighbor(r, c, dist) {
            for (let dr = -dist; dr <= dist; dr++) {
                for (let dc = -dist; dc <= dist; dc++) {
                    const nR = r + dr, nC = c + dc;
                    if (nR >= 0 && nR < 9 && nC >= 0 && nC < 9) {
                        if (this.manager.grid[nR][nC].element.placed)
                            return true;
                    }
                }
            }
            return false;
        }
        simulatePointCheck(row, col, plyId, layer = 0) {
            let connections = 0;
            WIN_PATTERNS.forEach((p) => {
                const match = p.every((off) => {
                    const nR = row + off[0], nC = col + off[1], nL = layer + off[2];
                    if (nR < 0 || nR >= 9 || nC < 0 || nC >= 9)
                        return false;
                    if (nL < 0 || nL >= 3)
                        return false;
                    const tile = this.manager.grid[nR][nC];
                    if (tile.layers[nL]) {
                        return tile.layers[nL].player === plyId;
                    }
                    if (nL === 0) {
                        return tile.element.placed && tile.element.player === plyId;
                    }
                    return false;
                });
                if (match)
                    connections++;
            });
            return connections;
        }
    }

    class GameEngine {
        config;
        grid = [];
        currentPlayer = 1;
        selected = { x: 0, y: 0, tile: null };
        prevSelectedTile = null;
        isProcessing = false;
        camera = { degX: 54, degY: -29 };
        mouse = { x: 0, y: 0 };
        targetX = 54;
        targetY = -29;
        ticking = false;
        bot;
        _moveRef;
        _upRef;
        _mouseDownRef;
        _gameClickRef;
        constructor() {
            this.config = new GameConfig();
            this.bot = new GameBot(this, 2, 'hard');
            this._mouseDownRef = (e) => this.onMouseDown(e);
            this._gameClickRef = () => this.placeBox();
            this.setupEventListeners();
            this.init();
        }
        setupEventListeners() {
            const diffSelector = DomUtils.get('bot-difficulty');
            if (diffSelector) {
                diffSelector.addEventListener('change', (e) => {
                    this.bot.difficulty = e.target.value;
                    this.notify(`Difficulty: ${this.bot.difficulty.toUpperCase()}`);
                });
            }
            const resetBtn = DomUtils.get('reset-game');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.reset());
            }
            const depthSelector = DomUtils.get('bot-depth');
            if (depthSelector) {
                depthSelector.addEventListener('change', (e) => {
                    this.bot.maxDepth = parseInt(e.target.value);
                    this.notify(`Foresight: ${this.bot.maxDepth} Moves`);
                });
            }
            document.addEventListener('mousedown', this._mouseDownRef);
            this.config.dom.game.addEventListener('click', this._gameClickRef);
        }
        init() {
            for (let i = 0; i < this.config.rows; i++) {
                this.grid[i] = [];
                for (let j = 0; j < this.config.cols; j++) {
                    this.grid[i].push(new Tile(j, i, this.config.boxSize, this));
                }
            }
        }
        notify(text, isCombo = false) {
            const msg = DomUtils.make('div', 'game-notification');
            msg.innerText = text;
            if (isCombo)
                msg.classList.add('combo-text');
            this.config.dom.msgBox.appendChild(msg);
            setTimeout(() => msg.remove(), 2000);
        }
        placeBox(targetParent = null, isBotAction = false) {
            if (this.isProcessing)
                return;
            if (this.currentPlayer === 2 && !isBotAction)
                return;
            const tile = this.selected.tile;
            if (!tile || (targetParent === null && tile.element.placed))
                return;
            if (targetParent !== null && tile.layers.length >= 3)
                return;
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
                }
                else {
                    this.switchPlayer();
                    this.config.dom.game.classList.remove('locked');
                }
            }, 200);
        }
        isBoardFull() {
            return this.grid.every((row) => row.every((t) => t.element.placed));
        }
        announceGameOver() {
            const s1 = this.config.players[1].score;
            const s2 = this.config.players[2].score;
            if (s1 > s2) {
                this.notify('Game Over — Player One Wins!');
            }
            else if (s2 > s1) {
                this.notify('Game Over — Player Two Wins!');
            }
            else {
                this.notify('Game Over — Draw!');
            }
            this.config.dom.game.classList.add('locked');
        }
        checkPoints(layer) {
            const { x: col, y: row } = this.selected;
            const ply = this.currentPlayer;
            const contributors = [];
            const getCube = (r, c, dl) => {
                const nR = row + r, nC = col + c, nL = layer + dl;
                if (nR < 0 || nR >= this.config.rows || nC < 0 || nC >= this.config.cols)
                    return null;
                if (nL < 0 || nL >= 3)
                    return null;
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
        updateUI() {
            if (this.config.dom.scoreOne)
                this.config.dom.scoreOne.innerHTML = String(this.config.players[1].score);
            if (this.config.dom.scoreTwo)
                this.config.dom.scoreTwo.innerHTML = String(this.config.players[2].score);
        }
        switchPlayer() {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            if (this.currentPlayer === 2) {
                this.config.dom.game.classList.add('locked');
                this.bot.takeTurn();
            }
            else {
                this.config.dom.game.classList.remove('locked');
            }
        }
        reset() {
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
        onMouseDown(e) {
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
        handleMouseMove(e) {
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
        stopCamera() {
            if (this._moveRef)
                window.removeEventListener('mousemove', this._moveRef);
            if (this._upRef)
                window.removeEventListener('mouseup', this._upRef);
            this.camera.degX = this.targetX;
            this.camera.degY = this.targetY;
        }
    }

    new GameEngine();

})();
//# sourceMappingURL=bundle.js.map
