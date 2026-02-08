import { ExtendedElement } from './types';
import { DomUtils } from './DomUtils';
import type { GameEngine } from './GameEngine';

export class UserBox {
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
