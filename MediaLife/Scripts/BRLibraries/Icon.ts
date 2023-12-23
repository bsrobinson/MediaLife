import { EventAttributes, firstOfClass, firstOfTagOrNull, makeElement } from "./DOM"

export interface IconProperties {
    style?: IconStyle;
    fixedWidth?: boolean;
    animation?: IconAnimation;
    rotate?: IconRotate;
}
export class Icon implements IconProperties {
    nameOrEmoji: string;
    style: IconStyle;
    fixedWidth?: boolean;
    animation?: IconAnimation;
    rotate?: IconRotate;

    constructor(nameOrEmoji: string, options: IconProperties | null = null) {
        this.nameOrEmoji = nameOrEmoji;
        this.style = options?.style ?? IconStyle.Regular;
        this.fixedWidth = options?.fixedWidth;
        this.animation = options?.animation;
        this.rotate = options?.rotate
    }

    classes() {
        let classes: string[] = [];
        if (!this.isEmoji()) {
            classes.push(this.style);
            classes.push(`fa-${this.nameOrEmoji}`);
        }
        if (this.fixedWidth) { classes.push('fa-fw'); }
        if (this.animation != null) { classes.push(this.animation.classes()); }
        if (this.rotate != null) { classes.push(this.rotate); }
        return classes.join(' ');
    }

    styles() {
        let styles: string[] = [];
        if (this.animation != null) { styles.push(this.animation.styles()); }
        return styles.join(' ');
    }

    isEmoji() {
        return [...this.nameOrEmoji].length == 1;
    }
}

export class RegularIcon extends Icon {
    constructor(nameOrEmoji: string, options: IconProperties | null = null) {
        options = { ...options, style: IconStyle.Regular };
        super(nameOrEmoji, options);
    }
}

export class SolidIcon extends Icon {
    constructor(nameOrEmoji: string, options: IconProperties | null = null) {
        options = { ...options, style: IconStyle.Solid };
        super(nameOrEmoji, options);
    }
}

export class BrandIcon extends Icon {
    constructor(nameOrEmoji: string, options: IconProperties | null = null) {
        options = { ...options, style: IconStyle.Brands };
        super(nameOrEmoji, options);
    }
}

export interface IconAnimationProperties { 
    /** Set an initial delay for animation in Milliseconds */
    delay?: number,
    /** Set direction for animation. Any valid CSS animation-direction value */
    direction?: string,
    /** Set duration for animation in Milliseconds */
    duration?: number,
    /** Set number of iterations for animation	A number (e.g. 1, 1.5, etc) or null for infinite */
    iterations?: number,
    /** Set how the animation progresses through frames	Any valid CSS animation-timing-function value */
    timing?: string,
}
export abstract class IconAnimation implements IconAnimationProperties {
    delay?: number = undefined;
    direction?: string = undefined;
    duration?: number = undefined;
    iterations?: number = undefined;
    timing?: string = undefined;

    constructor(params: IconAnimationProperties) {
        this.delay = params.delay;
        this.direction = params.direction;
        this.duration = params.duration;
        this.iterations = params.iterations;
        this.timing = params.timing;
    }

    classes() { return ''; }
    styles() {
        let styles: string[] = [];
        if (this.delay != null) { styles.push(`--fa-animation-delay:${this.delay}ms;`); }
        if (this.direction != null) { styles.push(`--fa-animation-direction:${this.direction};`); }
        if (this.duration != null) { styles.push(`--fa-animation-duration:${this.duration}ms;`); }
        if (this.iterations != null) { styles.push(`--fa-animation-iteration-count:${this.iterations};`); }
        if (this.timing != null) { styles.push(`--fa-animation-timing:${this.timing};`); }
        return styles.join(' ');
    }
}

export interface BeatAnimationProperties extends IconAnimationProperties { 
    /** Set max value that an icon will scale */
    scale?: number 
};
export class BeatAnimation extends IconAnimation implements BeatAnimationProperties {
    scale?: number = undefined;

    constructor(params: BeatAnimationProperties | null = null) {
        super(params ?? {});
        if (params) {
            this.scale = params.scale;
        }
    }

    classes() { return [ super.classes(), 'fa-beat' ].join(' '); }
    styles() {
        let styles: string[] = [ super.styles() ];
        if (this.scale != null) { styles.push(`--fa-beat-scale:${this.scale};`); }
        return styles.join(' ');
    }
}

export interface FadeAnimationProperties extends IconAnimationProperties {
    /** Set lowest opacity value an icon will fade to and from */
    opacity?: number,
}
export class FadeAnimation extends IconAnimation implements FadeAnimationProperties {
    opacity?: number = undefined;

    constructor(params: FadeAnimationProperties | null = null) {
        super(params ?? {});
        if (params) {
            this.opacity = params.opacity;
        }
    }

    classes() { return [ super.classes(), 'fa-fade' ].join(' '); }
    styles() {
        let styles: string[] = [ super.styles() ];
        if (this.opacity != null) { styles.push(`--fa-fade-opacity:${this.opacity};`); }
        return styles.join(' ');
    }
}

export interface BeatFadeAnimationProperties extends IconAnimationProperties {
    /** Set lowest opacity value an icon will fade to and from */
    fadeOpacity?: number,
    /** Set max value that an icon will scale */
    fadeScale?: number,
}
export class BeatFadeAnimation extends IconAnimation implements BeatFadeAnimationProperties {
    fadeOpacity?: number = undefined;
    fadeScale?: number = undefined;

    constructor(params: BeatFadeAnimationProperties | null = null) {
        super(params ?? {});
        if (params) {
            this.fadeOpacity = params.fadeOpacity;
            this.fadeScale = params.fadeScale;
        }
    }

    classes() { return [ super.classes(), 'fa-beat-fade' ].join(' '); }
    styles() {
        let styles: string[] = [ super.styles() ];
        if (this.fadeOpacity != null) { styles.push(`--fa-beat-fade-opacity:${this.fadeOpacity};`); }
        if (this.fadeScale != null) { styles.push(`--fa-beat-fade-scale:${this.fadeScale};`); }
        return styles.join(' ');
    }
}

export interface BounceAnimationProperties extends IconAnimationProperties {
    /** Set the amount of rebound an icon has when landing after the jump */
    rebound?: number,
    /** Set the max height an icon will jump to when bouncing */
    height?: number,
    /** Set the icon's horizontal distortion ("squish") when starting to bounce */
    startScaleX?: number,
    /** Set the icon's vertical distortion ("squish") when starting to bounce */
    startScaleY?: number,
    /** Set the icon's horizontal distortion ("squish") at the top of the jump */
    jumpScaleX?: number,
    /** Set the icon's vertical distortion ("squish") at the top of the jump */
    jumpScaleY?: number,
    /** Set the icon's horizontal distortion ("squish") when landing after the jump */
    landScaleX?: number,
    /** Set the icon's vertical distortion ("squish") when landing after the jump */
    landScaleY?: number,
}
export class BounceAnimation extends IconAnimation implements BounceAnimationProperties {
    rebound?: number = undefined;
    height?: number = undefined;
    startScaleX?: number = undefined;
    startScaleY?: number = undefined;
    jumpScaleX?: number = undefined;
    jumpScaleY?: number = undefined;
    landScaleX?: number = undefined;
    landScaleY?: number = undefined;

    constructor(params: BounceAnimationProperties | null = null) {
        super(params ?? {});
        if (params) {
            this.rebound = params.rebound;
            this.height = params.height;
            this.startScaleX = params.startScaleX;
            this.startScaleY = params.startScaleY;
            this.jumpScaleX = params.jumpScaleX;
            this.jumpScaleY = params.jumpScaleY;
            this.landScaleX = params.landScaleX;
            this.landScaleY = params.landScaleY;
        }
    }

    classes() { return [ super.classes(), 'fa-bounce' ].join(' '); }
    styles() {
        let styles: string[] = [ super.styles() ];
        if (this.rebound != null) { styles.push(`:--fa-bounce-rebound:${this.rebound}px;`); }
        if (this.height != null) { styles.push(`--fa-bounce-height:${this.height}px;`); }
        if (this.startScaleX != null) { styles.push(`--fa-bounce-start-scale-x:${this.startScaleX};`); }
        if (this.startScaleY != null) { styles.push(`--fa-bounce-start-scale-y:${this.startScaleY};`); }
        if (this.jumpScaleX != null) { styles.push(`--fa-bounce-jump-scale-x:${this.jumpScaleX};`); }
        if (this.jumpScaleY != null) { styles.push(`--fa-bounce-jump-scale-y:${this.jumpScaleY};`); }
        if (this.landScaleX != null) { styles.push(`--fa-bounce-land-scale-x:${this.landScaleX};`); }
        if (this.landScaleY != null) { styles.push(`--fa-bounce-land-scale-y:${this.landScaleY};`); }
        return styles.join(' ');
    }
}

export interface FlipAnimationProperties extends IconAnimationProperties {
    /** Set x-coordinate of the vector denoting the axis of rotation (between 0 and 1) */
    flipX?: number,
    /** Set y-coordinate of the vector denoting the axis of rotation (between 0 and 1) */
    flipY?: number,
    /** Set z-coordinate of the vector denoting the axis of rotation (between 0 and 1) */
    flipZ?: number,
    /** Set rotation angle of flip. A positive angle denotes a clockwise rotation, a negative angle a counter-clockwise one. */
    flipAngle?: number,
}
export class FlipAnimation extends IconAnimation implements FlipAnimationProperties {
    flipX?: number = undefined;
    flipY?: number = undefined;
    flipZ?: number = undefined;
    flipAngle?: number = undefined;

    constructor(params: FlipAnimationProperties | null = null) {
        super(params ?? {});
        if (params) {
            this.flipX = params.flipX;
            this.flipY = params.flipY;
            this.flipZ = params.flipZ;
            this.flipAngle = params.flipAngle;
        }
    }

    classes() { return [ super.classes(), 'fa-flip' ].join(' '); }
    styles() {
        let styles: string[] = [ super.styles() ];
        if (this.flipX != null) { styles.push(`--fa-flip-x:${this.flipX};`); }
        if (this.flipY != null) { styles.push(`--fa-flip-y:${this.flipY};`); }
        if (this.flipZ != null) { styles.push(`--fa-flip-z:${this.flipZ};`); }
        if (this.flipAngle != null) { styles.push(`--fa-flip-angle:${this.flipAngle};`); }
        return styles.join(' ');
    }
}

export interface ShakeAnimationProperties extends IconAnimationProperties {
}
export class ShakeAnimation extends IconAnimation implements ShakeAnimationProperties {
    
    constructor(params: ShakeAnimationProperties | null = null) {
        super(params ?? {});
    }

    classes() { return [ super.classes(), 'fa-shake' ].join(' '); }
    styles() { return super.styles(); }
}

export interface SpinAnimationProperties extends IconAnimationProperties {
    /** Makes an icon spin counter-clockwise. */
    reverse?: boolean,
}
export class SpinAnimation extends IconAnimation implements SpinAnimationProperties {
    reverse?: boolean = undefined;

    constructor(params: SpinAnimationProperties | null = null) {
        super(params ?? {});
        if (params) {
            this.reverse = params.reverse;
        }
    }

    classes() {
        let classes: string[] = [ super.classes(), 'fa-spin' ];
        if (this.reverse) { classes.push('fa-spin-reverse'); }
        return classes.join(' ');
    }
    styles() { return super.styles(); }
}

export interface SpinPulseAnimationProperties extends IconAnimationProperties {
    /** Makes an icon spin counter-clockwise. */
    reverse?: boolean,
}
export class SpinPulseAnimation extends IconAnimation implements SpinPulseAnimationProperties {
    reverse?: boolean = undefined;

    constructor(params: SpinPulseAnimationProperties | null = null) {
        super(params ?? {} as IconAnimationProperties);
        if (params) {
            this.reverse = params.reverse;
        }
    }

    classes() {
        let classes: string[] = [ super.classes(), 'fa-spin-pulse' ];
        if (this.reverse) { classes.push('fa-spin-reverse'); }
        return classes.join(' ');
    }
    styles() { return super.styles(); }
}

export enum IconStyle {
    Solid = 'fa-solid',
    Regular = 'fa-regular',
    Brands = 'fa-brands',
}

export enum IconRotate {
    Rotate90 = 'fa-rotate-90',
    Rotate180 = 'fa-rotate-180',
    Rotate270 = 'fa-rotate-270',
    FlipHorizontal = 'fa-flip-horizontal',
    FlipVertical = 'fa-flip-vertical',
    FlipBoth = 'fa-flip-both',
}

export class IconElementOptions {
    label?: string = undefined;
    url?: string = undefined;
    click?: EventListener = undefined;
    class?: string = undefined;
    htmlAttributes?: Record<string, string | null> = undefined;
}

declare global { interface HTMLElement {
    appendIcon(iconOrEmoji: Icon | string): HTMLElement;
    appendIcon(iconOrEmoji: Icon | string, options: IconElementOptions): HTMLElement;
    changeIcon(iconOrEmoji: Icon | string): void;
} }
HTMLElement.prototype.appendIcon = function (iconOrEmoji: Icon | string, options: IconElementOptions | null = null): HTMLElement {
    return this.appendChild(makeIcon(iconOrEmoji, options))
}

HTMLElement.prototype.changeIcon = function (iconObjOrName: Icon | string): void {
    let iconElement: HTMLElement = this;
    if (iconElement.tagName.toLowerCase() != 'icon') {
        let icon = firstOfTagOrNull('icon', this)
        if (icon) { iconElement = icon; }
    }
    if (iconElement.tagName.toLowerCase() == 'icon') {
        [...iconElement.classList].filter(c => c.slice(0, 3) == 'fa-').forEach(c => iconElement.removeClass(c));
        [...iconElement.style].filter(s => s.slice(0, 5) == '--fa-').forEach(s => iconElement.style.removeProperty(s));

        let icon = getIcon(iconObjOrName);
        iconElement.className = [iconElement.className, icon.classes()].join(' ');
        iconElement.style.cssText = [iconElement.style.cssText, icon.styles()].join(';');
        iconElement.html(icon.isEmoji() ? icon.nameOrEmoji : '');
    }
}

export function makeIcon(iconObjOrName: Icon | string, options: IconElementOptions | null = null): HTMLElement {

    options = { ...new IconElementOptions(), ...(options ?? {}) };
    let icon = getIcon(iconObjOrName);

    let iconClasses = icon.classes();
    let iconAttributes: Record<string, string | null> = {};
    if (!options.label && options.url == null && options.click == undefined) { 
        iconClasses += options.class ? ` ${options.class}` : '';
        iconAttributes = options.htmlAttributes || {};
    }

    let iconElement = makeElement('icon', { class: iconClasses, style: icon.styles(), ...iconAttributes, html: icon.isEmoji() ? icon.nameOrEmoji : '' });

    if (options.label || options.url || options.click != undefined) {
        let outerProperties = { class: options.class, ...(options.htmlAttributes || {}) }
        if (options.url == null && options.click == undefined) {
            let div = makeElement('icon-and-label', outerProperties);
            div.addClass('icon-wrapper');
            div.appendChild(iconElement);
            if (options.label) { div.appendElement('span', { class: 'label', html: options.label }); }
            return div;
        }
        else {
            let href = options.click == undefined ? options.url : 'JavaScript:;';
            let events: EventAttributes = options.click == undefined ? {} : { click: options.click };
            let link = makeElement('icon-link', { class: 'icon-wrapper' });
            let a = link.appendElement('a', { href: href, events: events, ...outerProperties });
            a.appendChild(iconElement);
            if (options.label) { a.appendElement('span', { class: 'label', html: options.label }); }
            return link;
        }
    }
    
    iconElement.addClass('icon-wrapper');
    return iconElement;
}

function getIcon(iconOrEmoji: string | Icon): Icon {
    return iconOrEmoji instanceof Icon ? iconOrEmoji : new Icon(iconOrEmoji);
}