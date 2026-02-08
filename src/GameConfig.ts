import { Player } from './types';
import { DomUtils } from './DomUtils';

export class GameConfig {
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
