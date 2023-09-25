import { ElementAttributes } from "./BRLibraries/DOM";

export class IconMenu {

    //**
    //** this class is only used by the watch icon, and still uses 'watch icon terminology'
    //** should be made more generic
    //!!

    menuNode: HTMLElement;

    menuHoverTimeout: NodeJS.Timeout | null = null;
    touchTimer: NodeJS.Timeout | null = null;

    constructor(public id: string, public parentNode: HTMLElement, public button: HTMLElement, public items: ElementAttributes[]) {

        if (!window.iconMenus) {
            window.iconMenus = {};
        }
        let thisId = `__ICON_MENU_${id}`;
        if (window.iconMenus[thisId]) {
            this.menuNode = window.iconMenus[thisId].menuNode;
        }
        else {

            window.iconMenus[thisId] = this;

            this.parentNode.onmouseenter = () => this.menuButtonEnter();
            this.parentNode.onmouseleave = () => this.menuButtonLeave();
            button.ontouchstart = (e: Event) => this.touchStart(e);
            button.ontouchend = (e: Event) => this.touchEnd(e);
            button.ontouchmove = (e: Event) => this.touchEnd(e);

            this.menuNode = this.parentNode.appendElement('div', {
                class: 'watched-menu',
                events: {
                    mouseenter: () => this.mouseEnterMenu(),
                    mouseleave: () => this.mouseLeaveMenu()
                }
            });
            this.items.forEach(item => {

                item.html = item.html || item.title;
                item.class = 'menu-item ' + item.class;

                item.events = item.events || {};
                item.events.mouseenter = (e: Event) => this.mouseEnterMenuItem(e);
                item.events.mouseleave = (e: Event) => this.mouseLeaveMenuItem(e);

                this.menuNode.appendElement('div', item);
            });
            this.menuNode.appendElement('div', { class: 'active-mark' });
        }
    }

    menuButtonEnter() {

        if (this.parentNode.containsClass('search-page')) {
            this.menuNode.style.right = (-((this.menuNode.offsetWidth - this.parentNode.offsetWidth) / 2)) + 'px';
            let menuPos = this.menuNode.getPosition();
            if (menuPos.left < 24) {
                this.menuNode.style.right = (parseInt(this.menuNode.style.right) + menuPos.left - 24) + 'px';
            }
            if (menuPos.right < 24) {
                this.menuNode.style.right = (parseInt(this.menuNode.style.right) - menuPos.right + 24) + 'px';
            }
        }
        this.menuHoverTimeout = setTimeout(() => {
            this.parentNode.addClass('hover');
        }, 500);
        this.displayActiveMenuItem(this.parentNode.getElementsByClassName('watched')[0] as HTMLElement);

    }

    menuButtonLeave() {
        if (this.menuHoverTimeout) {
            clearTimeout(this.menuHoverTimeout);
        }
        this.parentNode.removeClass('hover');
        this.hideActiveMarks();
    }

    mouseEnterMenu() {
        if (this.menuHoverTimeout) {
            clearTimeout(window.watchMenuTimeout);
        }
        document.body.addClass('all-watch-menus-open');
    }

    mouseLeaveMenu() {
        window.watchMenuTimeout = setTimeout(function () {
            document.body.removeClass('all-watch-menus-open');
        }, 100);
    }


    mouseEnterMenuItem(event: Event) {
        let menuItem = event.target;
        if (menuItem instanceof HTMLElement) {
            this.displayActiveMenuItem(menuItem);
        }
    }

    displayActiveMenuItem(menuItem: HTMLElement) {
        let activeMark = this.menuNode.getElementsByClassName('active-mark')[0] as HTMLElement;
        let markLeft = parseInt(activeMark.style.left);
        let itemLeft = menuItem.getPosition(this.menuNode).left;
        let timeout = 0;
        if (activeMark.offsetWidth == 0 && (isNaN(markLeft) || itemLeft < markLeft || itemLeft > markLeft + activeMark.offsetWidth)) {
            activeMark.style.left = (itemLeft + (menuItem.offsetWidth / 2)) + 'px';
            timeout = 250;
        }
        setTimeout(() => {
            activeMark.style.left = (itemLeft + 5) + 'px';
            activeMark.style.width = (menuItem.offsetWidth - 10) + 'px';
        }, timeout);
    }
    mouseLeaveMenuItem(event: Event) {
        let menuItem = event.target;
        if (menuItem instanceof HTMLElement) {
            this.hideActiveMenuItem(menuItem);
        }
    }

    hideActiveMenuItem(menuItem: HTMLElement) {
        let activeMark = this.menuNode.getElementsByClassName('active-mark')[0] as HTMLElement;
        let itemLeft = menuItem.getPosition(this.menuNode).left;
        activeMark.style.left = (itemLeft + (activeMark.offsetWidth / 2)) + 'px';
        this.hideActiveMarks();
    }

    hideActiveMarks() {
        Array.from(document.getElementsByClassName('active-mark')).forEach((m: Element) => {
            (m as HTMLElement).style.width = '0px';
        });
    }


    touchStart(e: Event) {
        this.absorbEvent(e);
        this.touchTimer = setTimeout(() => {
            this.touchTimer = null;
            for (const [key, value] of Object.entries(window.iconMenus)) {
                value.closeTouchMenu();
            }
            this.parentNode.addClass('touch-menu-open');
        }, 500);
    }

    touchEnd(e: Event) {
        this.absorbEvent(e);
        if (this.touchTimer) {
            clearTimeout(this.touchTimer);
            (this.parentNode.getElementsByClassName('watched')[0] as HTMLElement).click();
        }
    }

    closeTouchMenu() {
        this.parentNode.removeClass('touch-menu-open');
    }

    absorbEvent(e: Event) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
        e.cancelBubble = true;
        e.returnValue = false;
        return false;
    }
}