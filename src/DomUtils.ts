import { ExtendedElement } from './types';

export class DomUtils {
    static get<T extends HTMLElement>(id: string): T {
        return document.getElementById(id) as T;
    }

    static make(tag: string, className?: string): ExtendedElement {
        const el = document.createElement(tag) as ExtendedElement;
        if (className) el.className = className;
        return el;
    }
}
