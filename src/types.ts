/**
 * Custom Types & Interfaces
 */
interface ExtendedElement extends HTMLDivElement {
    placed?: boolean;
    player?: number;
}

interface Move {
    r: number;
    c: number;
    tile: Tile;
}

interface Player {
    name: string;
    score: number;
    class: string;
}
