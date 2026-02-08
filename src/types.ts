import type { Tile } from './Tile';

export interface ExtendedElement extends HTMLDivElement {
    placed?: boolean;
    player?: number;
}

export interface Move {
    r: number;
    c: number;
    tile: Tile;
    stackTarget?: ExtendedElement;
}

export interface Player {
    name: string;
    score: number;
    class: string;
}
