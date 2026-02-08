import { ExtendedElement } from './types';
import { DomUtils } from './DomUtils';
import type { GameEngine } from './GameEngine';
import type { UserBox } from './UserBox';

export class Tile {
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
