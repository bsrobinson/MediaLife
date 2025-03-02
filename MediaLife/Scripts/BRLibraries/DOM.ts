
export interface ElementAttributes {
    
    html?: string | null
    id?: string
    class?: string
    style?: string
    title?: string | null
    role?: string

    href?: string | null
    target?: string | null
    src?: string | null

    name?: string
    type?: ('text' | 'hidden' | 'checkbox' | 'radio' | 'submit' | 'button' | 'number' | 'date' | 'file') | null
    placeholder?: string
    value?: string | null
    maxlength?: number | null
    for?: string | null
    list?: string | null

    events?: EventAttributes
    bool?: BooleanAttributes
    data?: Record<string, string>
    aria?: Record<string, string>

    children?: HTMLElement[]
}

export interface EventAttributes {
    click?: EventListener
    contextmenu?: EventListener
    change?: EventListener
    mouseover?: EventListener
    mouseout?: EventListener
    mouseenter?: EventListener
    mouseleave?: EventListener
    keyup?: EventListener
    cancel?: EventListener
    dragenter?: EventListener
    dragleave?: EventListener
    dragover?: EventListener
    drop?: EventListener
}
export interface BooleanAttributes {
    disabled?: boolean
    selected?: boolean
    checked?: boolean
}


/**
* Get element of ID
* @param {string} e - Element ID
* @param {T} T - Override return type of element, defaults to HTMLElement
* @returns {HTMLElement} - Element
* @throws {Error} - Throws error if not found.
*/
export function element<T = HTMLElement>(e: string | HTMLElement): T {
    if (e instanceof HTMLElement) { return e as T }
    const element = elementOrNull(e)
    if (!element) {
        throw new Error(`Element ${e} not found`)
    }
    return element as T
}

/**
* Get element of ID
* @param {string} e - Element ID
* @param {T} T - Override return type of element, defaults to HTMLElement
* @returns {HTMLElement | null} - Element or null if no elements of class exist
*/
export function elementOrNull<T = HTMLElement>(e: string | HTMLElement): T | null {
    if (e instanceof HTMLElement) {
        return e as T
    }
    const element = document.getElementById(e)
    if (!element) {
        return null
    }
    return element as T
}

/**
* Check if element exists
* @param {string} e - Element ID
* @returns {boolean} - True if the element exists
*/
export function elementExists(e: string): boolean {
    return elementOrNull(e) != null
}

/**
* Check if element is missing
* @param {string} e - Element ID
* @returns {boolean} - True if the element does not exist
*/
export function elementMissing(e: string): boolean {
    return !elementExists(e)
}

/**
* Check if element exists
* @param {string} e - Element ID
* @param {T} T - Override return type of element, defaults to HTMLElement
* @returns {boolean} - True if the element exists
*/
export function tryGetElement<T = HTMLElement>(e: string, out: (element: T) => void): boolean {
    const element = elementOrNull<T>(e)
    if (element != null) {
        out(element)
        return true
    } else {
        return false
    }
}

/**
* Get first element with class name
* @param {string} className - Class Name
* @param {string} within - Search within element with this ID
* @param {T} T - Override return type of element, defaults to HTMLElement
* @throws {Error} - Throws error if no elements of class exist
* @returns {HTMLElement} - Element
*/
export function firstOfClass<T = HTMLElement>(className: string, within: string | HTMLElement | null = null): T {
    const element = firstOfClassOrNull(className, within)
    if (!element) {
        throw new Error(`No elements of class name '${className}'`)
    }
    return element as T
}

/**
* Get first element with class name or null if not found
* @param {string} className - Class Name
* @param {string | HTMLElement} within - Search within this element, or element of this ID
* @param {T} T - Override return type of element, defaults to HTMLElement
* @returns {HTMLElement | null} - Element or null if no elements of class exist
*/
export function firstOfClassOrNull<T = HTMLElement>(className: string, within: string | HTMLElement | null = null): T | null {
    const elements = (within != null ? element(within) : document).getElementsByClassName(className)
    if (elements.length < 1) {
        return null
    }
    return elements[0] as T
}

/**
* Get all elements with class name
* @param {string} className - Class Name
* @param {string} within - Search within element with this ID
* @param {T} T[] - Override return type of element, defaults to HTMLElement
* @returns {HTMLElement[]} - Element array, or an empty array
*/
export function elementsOfClass<T = HTMLElement>(className: string, within: string | HTMLElement | null = null): T[] {
    const elements = (within != null ? element(within) : document).getElementsByClassName(className)
    
    const returnElements: T[] = []
    for (let i = 0; i < elements.length; i++) {
        returnElements.push(elements[i] as T)
    }

    return returnElements
}

/**
* Get first element with tag name
* @param {string} tagName - Tag Name
* @param {string} within - Search within element with this ID
* @param {T} T - Override return type of element, defaults to HTMLElement
* @throws {Error} - Throws error if no elements of tag exist
* @returns {HTMLElement} - Element
*/
export function firstOfTag<T = HTMLElement>(tagName: string, within: string | HTMLElement | null = null): T {
    const element = firstOfTagOrNull(tagName, within)
    if (!element) {
        throw new Error(`No elements of tag name '${tagName}'`)
    }
    return element as T
}

/**
* Get first element with tag name or null if not found
* @param {string} tagName - Tag Name*
* @param {string | HTMLElement} within - Search within this element, or element of this ID
* @param {T} T - Override return type of element, defaults to HTMLElement
* @returns {HTMLElement | null} - Element or null if no elements of tag exist
*/
export function firstOfTagOrNull<T = HTMLElement>(tagName: string, within: string | HTMLElement | null = null): T | null {
    const elements = (within != null ? element(within) : document).getElementsByTagName(tagName)
    if (elements.length < 1) {
        return null
    }
    return elements[0] as T
}

/**
* Get all elements with tag name
* @param {string} tagName - Tag Name
* @param {string} within - Search within element with this ID
* @param {T} T[] - Override return type of element, defaults to HTMLElement
* @returns {HTMLElement[]} - Element array, or an empty array
*/
export function elementsOfTag<T = HTMLElement>(tagName: string, within: string | HTMLElement | null = null): T[] {
    const elements = (within != null ? element(within) : document).getElementsByTagName(tagName)
    
    const returnElements: T[] = []
    for (let i = 0; i < elements.length; i++) {
        returnElements.push(elements[i] as T)
    }

    return returnElements
}


declare global {
    interface HTMLElement {
    /**
    * Append a new element to the receiver
    * @param {string} htmlElementName - HTMLElement type, for example use `new HTMLDivElement`
    * @param {ElementAttributes} attributes - Attribute name and values
    * @returns {HTMLElement} - Newly created element
    */
        appendElement(htmlElementName: string, attributes?: ElementAttributes | null): HTMLElement
    }
}
HTMLElement.prototype.appendElement = function(htmlElementName: string, attributes: ElementAttributes | null = null): HTMLElement {
    return this.appendChild(makeElement(htmlElementName, attributes))
}

declare global {
    interface HTMLElement {
    /**
    * Insert an existing element into to the receivers parent, before the receiver
    * @param {HTMLElement} node - HTMLElement to insert
    * @param {string} where - Where to insert, 'before' or 'after'
    * @returns {HTMLElement} - Inserted element
    */
        insert(node: HTMLElement, where: ('before' | 'after')): HTMLElement | null
    }
}
HTMLElement.prototype.insert = function(htmlElement: HTMLElement, where: ('before' | 'after')): HTMLElement | null {
    if (this.parentNode) {
        return this.parentNode.insertBefore(htmlElement, where == 'before' ? this : this.nextSibling)
    }
    return null
}

declare global {
    interface HTMLElement {
    /**
    * Insert a new element into to the receivers parent, before the receiver
    * @param {string} htmlElementName - HTMLElement type, for example use `new HTMLDivElement`
    * @param {ElementAttributes} attributes - Attribute name and values
    * @returns {HTMLElement} - Newly created element
    */
        insertElementBefore(htmlElementName: string, attributes?: ElementAttributes | null): HTMLElement | null
    }
}
HTMLElement.prototype.insertElementBefore = function(htmlElementName: string, attributes: ElementAttributes | null = null): HTMLElement | null {
    return this.insert(makeElement<HTMLElement>(htmlElementName, attributes), 'before')
}

declare global {
    interface HTMLElement {
    /**
    * Insert a new element into to the receivers parent, after the receiver
    * @param {string} htmlElementName - HTMLElement type, for example use `new HTMLDivElement`
    * @param {ElementAttributes} attributes - Attribute name and values
    * @returns {HTMLElement} - Newly created element
    */
        insertElementAfter(htmlElementName: string, attributes?: ElementAttributes | null): HTMLElement | null
    }
}
HTMLElement.prototype.insertElementAfter = function(htmlElementName: string, attributes: ElementAttributes | null = null): HTMLElement | null {
    return this.insert(makeElement<HTMLElement>(htmlElementName, attributes), 'after')
}

declare global {
    interface HTMLElement {
    /**
    * Swap the receiver with the supplied element
    * @returns {HTMLElement} - Element to swap with, aborts silently if null
    */
        swapElement(element: HTMLElement | null): void
    }
}
HTMLElement.prototype.swapElement = function(element: HTMLElement | null): void {
    if (element == null) { return }
    const afterNode2 = element.nextElementSibling
    const parent = element.parentNode
    this.replaceWith(element)
    parent?.insertBefore(this, afterNode2)
}

declare global {
    interface HTMLElement {
    /**
    * Remove receiver from the DOM
    */
        removeElement(): void
    }
}
HTMLElement.prototype.removeElement = function(): void {
    if (this.parentNode) {
        this.parentNode.removeChild(this)
    }
}


/**
* Make new HTML Element
* @param {string} htmlElementName - HTMLElement type, for example use `new HTMLDivElement`
* @param {ElementAttributes} attributes - Attribute name and values
* @returns {HTMLElement} - The element
*/
export function makeElement<T extends HTMLElement = HTMLElement>(htmlElementName: string, attributes: ElementAttributes | null = null): T {
    const e = document.createElement(htmlElementName)
    for (const a in attributes) {
        if (a != 'children') {
            if (a == 'events') {
                const events = (attributes as Record<'events', Record<string, EventListener>>).events
                for (const v in events) {
                    if (events[v] != null) {
                        e.addEventListener(v, (e: Event) => events[v](e))
                    }
                }
            } else if (a == 'bool') {
                const booleans = (attributes as Record<'bool', Record<string, boolean>>).bool
                for (const b in booleans) {
                    if (booleans[b] == true) {
                        e.setAttribute(b, b)
                    }
                }
            } else if (a == 'data') {
                const dataAttrs = (attributes as Record<'data', Record<string, string>>).data
                for (const d in dataAttrs) {
                    e.setAttribute(a + '-' + d, dataAttrs[d])
                }
            } else if (a == 'aria') {
                const arias = (attributes as Record<'aria', Record<string, string>>).aria
                for (const d in arias) {
                    e.setAttribute(a + '-' + d, arias[d])
                }
            } else {
                const string = (attributes as Record<string, string>)[a]
                if (a == 'html') {
                    e.innerHTML = string
                } else if (string !== null && string !== undefined) {
                    e.setAttribute(a, string)
                }
            }
        }
    }
    (attributes?.children ?? []).forEach(child => {
        e.appendChild(child)
    })

    return e as T
}


declare global {
    interface HTMLElement {
    /**
    * Find first parent in tree of type
    * @param {string} nodeName - Name of new node or tag (e.g. div)
    * @returns {HTMLElement} - Matching parent or null
    */
        parentOfType(nodeName: string, includeThis?: boolean): HTMLElement | null
    }
}
HTMLElement.prototype.parentOfType = function(nodeName: string, includeThis = true): HTMLElement | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- https://stackoverflow.com/questions/78868560
    let e = this
    if (includeThis && e.nodeName.toLowerCase() == nodeName.toLowerCase()) {
        return e
    }
    while (e.parentElement) {
        e = e.parentElement
        if (e.nodeName && e.nodeName.toLowerCase() == nodeName.toLowerCase()) {
            return e
        }
    }
    return null
}

declare global {
    interface HTMLElement {
    /**
    * Find first parent in tree with matching id
    * @param {string} id - Id of element
    * @returns {HTMLElement} - Matching parent or null
    */
        parentOfId(id: string, includeThis?: boolean): HTMLElement | null
    }
}
HTMLElement.prototype.parentOfId = function(id: string, includeThis = true): HTMLElement | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- https://stackoverflow.com/questions/78868560
    let e = this
    if (includeThis && e.id == id) {
        return e
    }
    while (e.parentElement) {
        e = e.parentElement
        if (e.id && e.id == id) {
            return e
        }
    }
    return null
}

declare global {
    interface HTMLElement {
    /**
    * Find first parent in tree with matching class
    * @param {string} nodeName - Class name of element
    * @returns {HTMLElement} - Matching parent or null
    */
        parentOfClass(className: string, includeThis?: boolean): HTMLElement | null
    }
}
HTMLElement.prototype.parentOfClass = function(className: string, includeThis = true): HTMLElement | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- https://stackoverflow.com/questions/78868560
    let e = this
    if (includeThis && e.containsClass(className)) {
        return e
    }
    while (e.parentElement) {
        e = e.parentElement
        if (e.className && e.containsClass(className)) {
            return e
        }
    }
    return null
}

declare global {
    interface HTMLElement {
    /**
    * Check if the element is in the accessibility tree; i.e. not removed with aria-hidden
    */
        inAccessibilityTree(): boolean
    }
}
HTMLElement.prototype.inAccessibilityTree = function(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- https://stackoverflow.com/questions/78868560
    let e = this
    while (e.parentElement) {
        if (e.getAttribute('aria-hidden') == 'false') {
            return true
        }
        if (e.getAttribute('aria-hidden') == 'true') {
            return false
        }
        e = e.parentElement
    }
    return true
}


declare global {
    interface HTMLElement {
    /**
    * Add class name to receiver, unless exists
    * @param {string} newClass - New class name
    * @returns {boolean} - Was successful
    */
        addClass(newClass: string): boolean
    }
}
HTMLElement.prototype.addClass = function(newClass: string): boolean {
    if (!this.containsClass(newClass)) {
        this.className += ((this.className != '') ? ' ' : '') + newClass
        return true
    }
    return false
}

declare global {
    interface HTMLElement {
    /**
     * Removed a class name from the receiver if it exists
     * @param {string} oldClass - Class name to remove
     * @returns {boolean} - Was successful
    */
        removeClass(oldClass: string): boolean
    }
}
HTMLElement.prototype.removeClass = function(oldClass: string): boolean {
    if (this.className != undefined) {
        this.className = (' ' + this.className + ' ').replace(' ' + oldClass + ' ', ' ')
        if (this.className.trim == undefined) {
            this.className = this.className.replace(/^\s+|\s+$/g, '')
        } else {
            this.className = this.className.trim()
        }
        return true
    }
    return false
}

declare global {
    interface HTMLElement {
    /**
     * Adds class name if not present, or removes the class name if it is present
     * @param {string} className - Class name to toggle
    */
        toggleClass(className: string): void
    }
}
HTMLElement.prototype.toggleClass = function(className: string): void {
    if (this.containsClass(className)) {
        this.removeClass(className)
    } else {
        this.addClass(className)
    }
}

declare global {
    interface HTMLElement {
    /**
     * Adds class name if not present, or removes the class name if it is present
     * @param {string} className - Class name to toggle
     * @returns {boolean} - Was successful
    */
        swapClass(oldClassName: string, newClassName: string): boolean
    }
}
HTMLElement.prototype.swapClass = function(oldClassName: string, newClassName: string): boolean {
    if (this.containsClass(oldClassName)) {
        return this.removeClass(oldClassName) && this.addClass(newClassName)
    }
    return false
}

declare global {
    interface HTMLElement {
    /**
     * Checks if element has class name
     * @param {string} className - Class name to check for
     * @param {boolean} on - Add class if true, remove if false
    */
        toggleClassIfTrue(className: string, on: boolean): void
    }
}
HTMLElement.prototype.toggleClassIfTrue = function(className: string, on: boolean): void {
    if (on) {
        this.addClass(className)
    } else {
        this.removeClass(className)
    }
}

declare global {
    interface HTMLElement {
    /**
     * Checks if element has class name
     * @param {string} className - Class name to check for
     * @returns {boolean} - True if element contains class, otherwise false
    */
        containsClass(className: string): boolean
    }
}
HTMLElement.prototype.containsClass = function(className: string): boolean {
    return (' ' + this.className + ' ').indexOf(' ' + className + ' ') >= 0
}


declare global {
    interface HTMLElement {
    /**
    * Add 'hide' class to receiver
    */
        hide(): void
        hideIfTrue(on: boolean): void
    }
}
HTMLElement.prototype.hide = function(): void {
    this.addClass('hide')
}
HTMLElement.prototype.hideIfTrue = function(on: boolean): void {
    this.toggleClassIfTrue('hide', on)
}

declare global {
    interface HTMLElement {
    /**
    * Remove 'hide' class from the receiver
    */
        unhide(): void
    }
}
HTMLElement.prototype.unhide = function(): void {
    this.removeClass('hide')
}


declare global {
    interface HTMLElement {
    /**
    * Empty inner html
    * @returns {boolean} - True if element contains class, otherwise false
    */
        empty(): void
    }
}
HTMLElement.prototype.empty = function(): void {
    this.innerHTML = ''
}

declare global {
    interface HTMLElement {
    /**
     * Set or Get inner html
     * @param {string | null} html - Html to set, or null if getting
     * @returns {string} - The inner html
    */
        html(html?: string | null): string
    }
}
HTMLElement.prototype.html = function(html: string | null = null): string {
    if (html != null) {
        this.innerHTML = html
    }
    return this.innerHTML
}


declare global {
    interface HTMLFormElement {
    /**
    * Convert form elements to name=value pairs string
    * @returns {string} - '' if no elements
    */
        toUrlString(): string
    }
}
HTMLFormElement.prototype.toUrlString = function(): string {
    let string = ''
    for (let i = 0; i < this.elements.length; i++) {
        if (string != '') { string += '&' }
        const element = this.elements[i] as HTMLInputElement
        if (element.name) {
            string += element.name + '=' + encodeURIComponent(element.value)
        }
    }
    return string
}

declare global { interface HTMLFormElement {
    /**
    * Convert form elements and values to json object
    * @returns {object} - {} if no elements
    */
    toJson<T>(): T;
    toJson<T>(camelCase: boolean): T;
    toJson<T>(camelCase: boolean, nestDotted: boolean): T;
} }
HTMLFormElement.prototype.toJson = function<T>(camelCase: boolean = true, nestDotted: boolean = true): T {
	var obj: Record<string, object> = {};
 	for (var i = 0; i < this.elements.length; i++) {
 		let element = this.elements[i] as HTMLFormElement;
 		if (element.name) {
 			var val: any = element.value;
 			if (val == '' && this.elements[i].getAttribute('data-nullonempty') == 'true') {
 				val = null;
 			} else if (this.elements[i].getAttribute('data-type') == 'int') {
 				val = val == '' ? null : parseInt(val);
 			} else if (this.elements[i].getAttribute('data-type') == 'float') {
 				val = val == '' ? null : parseFloat(val);
 			} else if (this.elements[i].getAttribute('data-type') == 'bool') {
 				val = val.toLowerCase() == 'true';
 			}
 			if (element.type == 'checkbox') {
 				val = element.checked;
 			}

            if (nestDotted) {
                let dots = element.name.split('.');
                for (let j = 0; j < dots.length; j++) { dots[j] = fixCase(dots[j], camelCase); }
                
                let working = obj;
                for (let j = 0; j < dots.length - 1; j++) {
                    if (!working[dots[j]]) { working[dots[j]] = {} as Record<string, object>; }
                    working = working[dots[j]] as Record<string, object>;
                }
                working[dots[dots.length - 1]] = val;
            } else {
                obj[fixCase(element.name, camelCase)] = val;
            }
 		}
 	}
 	return obj as T;
}
function fixCase(s: string, toCamelCase: boolean): string {
    if (!toCamelCase) { return s; }
    if (s.length > 1) {
        s.slice(0, 1).toLocaleLowerCase() + s.slice(1);
    }
    return s.toLocaleLowerCase();
}

declare global {
    interface HTMLFormElement {
    /**
    * Disable all form elements
    */
        disable(): void
        /**
    * Enable all form elements
    */
        enable(): void
        /**
    * Toggle disabled state of all form elements
    */
        toggleDisabled(disabled: boolean): void
    }
}
HTMLFormElement.prototype.disable = function(): void {
    this.toggleDisabled(true)
}
HTMLFormElement.prototype.enable = function(): void {
    this.toggleDisabled(false)
}
HTMLFormElement.prototype.toggleDisabled = function(disabled: boolean): void {
    for (let i = 0; i < this.elements.length; i++) {
        (this.elements[i] as HTMLInputElement).disabled = disabled
    }
}