import { ElementAttributes, firstOfClassOrNull, firstOfTagOrNull, makeElement } from './DOM'
import { Icon, SolidIcon, SpinPulseAnimation, makeIcon } from './Icon'

declare global {
    interface Window {
        formKeyPresses: { button: HTMLButtonElement, key: string }[] | undefined
        formFocusedElement: HTMLElement | undefined
    }
}

export type InputType = ('text' | 'number' | 'date' | 'checkbox' | 'multiline')
export class FormElementOptions {
    style?: FormRowStyleType | null = 'outline'
    inputType?: InputType | null = null
    name?: string | null = null
    label?: string | null = null
    labelRight?: string | null = null
    secondaryLabel?: string | null = null
    secondaryLabelRight?: string | null = null
    value?: unknown = null
    icon?: Icon | null = null
    iconRight?: Icon | null = null
    secondaryIcon?: Icon | null = null
    secondaryIconRight?: Icon | null = null
    selectOptions?: HTMLOptionElement[] | null = null
    dataList?: string[] | null = null
    dataType?: string | null = null
    classes?: string = ''
    placeholder?: string = ''
    withSelectHandle?: boolean = false
    required?: boolean = false
    requiredStarOnRight?: boolean = false
    changed?: ((element: HTMLElement) => void) = undefined
    blur?: ((element: HTMLElement) => void) = undefined
    focus?: ((element: HTMLElement) => void) = undefined
    validationMessages?: ValidationTypes = {}
    maxLength?: number | null = null
    minimum?: number | null = null
    maximum?: number | null = null
}

export interface ValidationTypes {
    required?: string
    number?: string
    checked?: string
    range?: string
    rangeMin?: string
    rangeMax?: string
    regex?: string
    regexPattern?: string
    currency?: string
    compare?: string
    compareTo?: string
    compareOperand?: string
    DateDropdownsRequired?: string
    DateDropdownsRequiredMonthId?: string
    DateDropdownsRequiredYearId?: string
    CcDateInPast?: string
    CcDateInPastYearId?: string
    other?: string
    anyRequired?: string
    group?: string
    [key: string]: string | undefined
}

export class ButtonOptions {
    type?: ('button' | 'submit') = 'button'
    colour?: ('grey' | 'default-click' | 'green' | 'red' | 'transparent') = 'grey'
    thin?: boolean = false
    spaceAfter?: boolean = false
    stackedIcon?: boolean = false
    round?: boolean = false
    labelAsTitle?: boolean = false
    classes?: string = ''
    icon?: Icon | null = null
    iconRight?: Icon | null = null
    click?: ((e: { event: Event, button: HTMLButtonElement }) => void) = undefined
    url?: string | null = null
    htmlAttributes?: Record<string, string | null> = undefined
    clickKey?: string
}

export class ButtonRowOptions {
    justify?: ('flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly') = 'flex-end'
    thin?: boolean = false
    tight?: boolean = false
    classes?: string = ''
    htmlAttributes?: Record<string, string | null> = undefined
}

export type FormRowStyleType = ('outline' | 'outlineInset' | 'blockRow' | 'underline' | 'underlineHover' | 'inlineBorder' | 'inlineBorderHover' | 'frameless')
export class FormRowStyle {
    outline: string = 'form-field-row-style-outline'
    outlineInset: string = 'form-field-row-style-outline form-field-row-style-outline-inset'
    blockRow: string = 'form-field-row-style-block-row'
    underline: string = 'form-field-row-style-underline'
    underlineHover: string = 'form-field-row-style-underline form-field-row-style-underline-hover'
    inlineBorder: string = 'form-field-row-style-inline-border'
    inlineBorderHover: string = 'form-field-row-style-inline-border form-field-row-style-inline-border-hover'
    frameless: string = 'form-field-row-style-frameless'
}

declare global {
    interface HTMLElement {
        appendFormRow(id: string, options: FormElementOptions): HTMLElement
        appendFieldSet(label: string, fields: HTMLElement[], attributes?: ElementAttributes | null): HTMLElement
    }
}
HTMLElement.prototype.appendFormRow = function(id: string, options: FormElementOptions): HTMLElement {
    return this.appendChild(makeFormRow(id, options)).activateFormRow()
}
HTMLElement.prototype.appendFieldSet = function(label: string, fields: HTMLElement[], attributes: ElementAttributes | null = null): HTMLElement {
    return this.appendChild(makeFieldSet(label, fields, attributes))
}

export function makeFormRow(id: string, options: FormElementOptions): HTMLElement {
    
    options = { ...new FormElementOptions(), ...options }
    if (!options.validationMessages) { options.validationMessages = {} } //this line should not be hit, but causes compilation errors

    let type: (InputType | 'select') = options.inputType ?? 'text'
    if (options.inputType == null && options.value != null) {
        if (typeof(options.value) == 'boolean') { type = 'checkbox' }
        if (typeof(options.value) == 'number') { type = 'number' }
    }
    if (options.selectOptions) { type = 'select' }

    const classNames = [`form-field-row-${type}`]
    if (options.classes != null) { classNames.push(options.classes) }
    if ((type == 'number' || type == 'checkbox') && options.style == 'outline') {
        options.style = 'outlineInset'
    }
    if (options.style) {
        classNames.push(new FormRowStyle()[options.style])
    }

    if (type == 'checkbox') {
        classNames.push(`form-field-row-checkbox-${options.value === true ? '' : 'un'}checked`)
    }

    if (options.required == true && Object.keys(options.validationMessages).length == 0) { options.validationMessages.required = 'Field is required.' }
    if (type == 'number') { options.validationMessages.number = 'Field value must be a number' }
    if (options.minimum != null || options.maximum != null) {
        if (options.minimum != null && options.maximum != null) { options.validationMessages.range = `Field value must be between ${options.minimum} and ${options.maximum}.` }
        if (options.minimum != null && options.maximum == null) { options.validationMessages.range = `Field value must be greater than ${options.minimum}.` }
        if (options.minimum == null && options.maximum != null) { options.validationMessages.range = `Field value must be less than ${options.minimum}.` }
        if (options.minimum != null) { options.validationMessages.rangeMin = `${options.minimum}` }
        if (options.maximum != null) { options.validationMessages.rangeMax = `${options.maximum}` }
    }
    const dataAttr: Record<string, string> = {}
    if (type == 'number') {
        dataAttr['type'] = 'float'
    }
    if (options.dataType != null) {
        dataAttr['type'] = options.dataType
    }
    if (Object.keys(options.validationMessages).length > 0) {
        dataAttr['val'] = 'true'
        Object.keys(options.validationMessages).forEach((key) => {
            dataAttr['val'] = 'true'
            const value = (options.validationMessages ?? {})[key]
            if (value != null) {
                dataAttr[`val-${key}`] = value
            }
        })
    }

    const div = makeElement('form-field-row', { id: `formfieldrow_${id}`, class: classNames.join(' ') })
    
    const primaryLabel = makeElement('span', { class: 'primary-label' })
    if (options.secondaryIcon) { options.secondaryIcon.fixedWidth = true; primaryLabel.appendIcon(options.secondaryIcon) }
    if (options.label != null) { primaryLabel.appendElement('span', { html: options.label }) }
    if (options.required == true && options.requiredStarOnRight == false) { primaryLabel.appendElement('span', { class: 'required-star', title: options.validationMessages['required'] != null ? options.validationMessages['required'] : '', html: '*' }) }
    
    const secondaryLabel = makeElement('span', { class: 'secondary-label' })
    if (options.icon) { options.icon.fixedWidth = true; secondaryLabel.appendIcon(options.icon) }
    if (options.secondaryLabel != null) { secondaryLabel.appendElement('span', { html: options.secondaryLabel }) }
    
    const label = div.appendElement('label', { class: 'label-left', for: id })
    if (secondaryLabel.innerHTML) { label.appendChild(secondaryLabel) }
    if (primaryLabel.innerHTML) { label.appendChild(primaryLabel) }

    div.appendElement('div', { id: `${id}_validation_message`, class: 'validation-message' })

    if (type != 'select') {
        let valueOutput = options.value
        let checkedOutput: boolean | undefined = undefined
        let inputClass = ''
        if (type == 'checkbox') {
            valueOutput = null
            checkedOutput = options.value as boolean | undefined
            inputClass = 'switch'
        } else if (options.dataList) {
            const datalist = div.appendElement('datalist', { id: `${id}_datalist` })
            options.dataList.forEach(d => {
                datalist.appendElement('option', { value: d })
            })
        }

        const input = makeElement<HTMLInputElement>(type == 'multiline' ? 'textarea' : 'input', {
            type: type == 'multiline' ? undefined : type,
            placeholder: options.placeholder ?? '',
            id: id,
            name: options.name ?? id,
            class: inputClass,
            value: type == 'multiline' ? undefined : (valueOutput as string) ?? '',
            html: type == 'multiline' ? (valueOutput as string) ?? '' : undefined,
            maxlength: options.maxLength,
            list: options.dataList ? `${id}_datalist` : undefined,
            data: dataAttr,
            bool: { checked: checkedOutput },
        })

        if (type == 'checkbox') {
            const label = div.appendElement('label', { class: 'switch-wrapper', for: id })
            label.appendChild(input)
            label.appendElement('div', { class: 'focus-ring' })
        } else {
            div.appendChild(input)
            div.appendElement('div', { class: 'focus-ring' })
        }

        if (type == 'multiline') {
            input.addEventListener('keydown', () => { if (options.changed) { options.changed(input) } })
            input.addEventListener('keyup', () => { if (options.changed) { options.changed(input) } })
            input.addEventListener('change', () => { if (options.changed) { options.changed(input) } })
            input.addEventListener('cut', () => setTimeout(() => { if (options.changed) { options.changed(input) } }))
            input.addEventListener('paste', () => setTimeout(() => { if (options.changed) { options.changed(input) } }))
            input.addEventListener('blur', () => { if (options.changed) { options.changed(input) } })
        } else {
            input.addEventListener('keydown', () => { input.inputChange(options.changed) })
            input.addEventListener('keyup', () => { input.inputChange(options.changed) })
            input.addEventListener('change', () => { input.inputChange(options.changed) })
            input.addEventListener('cut', () => setTimeout(() => { input.inputChange(options.changed) }))
            input.addEventListener('paste', () => setTimeout(() => { input.inputChange(options.changed) }))
            input.addEventListener('blur', () => { input.inputChange(options.changed) })
        }
        input.addEventListener('blur', () => { if (options.blur) { options.blur(input) } })
        input.addEventListener('focus', () => { if (options.focus) { options.focus(input) } })
    } else if (options.selectOptions) {
        const select = div.appendElement('select', { id: id, name: options.name ?? id, data: dataAttr }) as HTMLSelectElement
        options.selectOptions?.forEach(o => {
            select.options.add(o)
        })
        div.appendElement('div', { class: 'focus-ring' })
        div.appendElement('div', { class: `select-value-display${options.withSelectHandle == true ? ' with-handle' : ''}`, html: options.selectOptions.find(o => o.selected)?.text ?? (options.selectOptions.length > 0 ? options.selectOptions[0].text : '') })
        
        // select.addEventListener('change', (e: Event) => { if (e.target instanceof HTMLSelectElement && e.target.nextSibling?.nextSibling instanceof HTMLElement) { e.target.nextSibling.nextSibling.innerHTML = e.target.options[e.target.selectedIndex].text; } });
        select.addEventListener('change', (e: Event) => { if (e.target instanceof HTMLSelectElement) e.target.setSelectedIndex(e.target.selectedIndex) })
        if (options.changed) {
            select.addEventListener('change', () => { if (options.changed) { options.changed(select) } })
        }
    }

    const primaryLabelRight = makeElement('span', { class: 'primary-label' })
    if (options.required == true && options.requiredStarOnRight == true) { primaryLabelRight.appendElement('span', { class: 'required-star', title: options.validationMessages['required'] != null ? options.validationMessages['required'] : '', html: '*' }) }
    if (options.labelRight != null) { primaryLabelRight.appendElement('span', { html: options.labelRight }) }
    if (options.secondaryIconRight) { options.secondaryIconRight.fixedWidth = true; primaryLabelRight.appendIcon(options.secondaryIconRight) }
    
    const secondaryLabelRight = makeElement('span', { class: 'secondary-label' })
    if (options.secondaryLabelRight != null) { secondaryLabelRight.appendElement('span', { html: options.secondaryLabelRight }) }
    if (options.iconRight) { options.iconRight.fixedWidth = true; secondaryLabelRight.appendIcon(options.iconRight) }
    
    const labelRight = div.appendElement('label', { class: 'label-right', for: id })
    if (primaryLabelRight.innerHTML) { labelRight.appendChild(primaryLabelRight) }
    if (secondaryLabelRight.innerHTML) { labelRight.appendChild(secondaryLabelRight) }

    return div
}

export function makeFieldSet(legend: string, fields: HTMLElement[], attributes: ElementAttributes | null = null, overrideFieldStyle: FormRowStyleType = 'blockRow'): HTMLElement {

    const formRowStyle = new FormRowStyle()

    const styles = Object.values(formRowStyle).reverse()
    fields.forEach(field => {
        styles.forEach((style: string) => {
            field.className = field.className.replace(style, formRowStyle[overrideFieldStyle])
        })
    })

    const e = makeElement('form-field-set', attributes)
    e.appendElement('div', { class: 'label', html: legend })
    fields.forEach(f => {
        e.appendChild(f)
        if (f.tagName.toLowerCase() == 'form-field-row') {
            f.activateFormRow()
        }
    })
    return e
}
declare global {
    interface HTMLSelectElement {
        setSelectedIndex(index: number): void
        setValue(value: string, dispatchEvent?: boolean): void
    }
}
HTMLSelectElement.prototype.setSelectedIndex = function(index: number): void {
    this.selectedIndex = index
    if (this.nextSibling?.nextSibling instanceof HTMLElement) {
        this.nextSibling.nextSibling.innerHTML = this.options[this.selectedIndex].text
    }
}
HTMLSelectElement.prototype.setValue = function(value: string, dispatchEvent: boolean = true): void {
    if (Array.from(this.options).find(o => o.value == value)) {
        this.value = value
        if (this.nextSibling?.nextSibling instanceof HTMLElement) {
            this.nextSibling.nextSibling.innerHTML = this.options[this.selectedIndex].text
        }
    }
    if (dispatchEvent) {
        this.dispatchEvent(new Event('change'))
    }
}


declare global {
    interface HTMLElement {
        appendButton(label: string, options?: ButtonOptions | null): HTMLButtonElement
        appendSubmitButton(label?: string, options?: ButtonOptions | null): HTMLButtonElement
        appendButtonRow(buttons: HTMLElement[], options?: ButtonRowOptions | null): HTMLElement
        appendSubmitRow(label?: string, submitOptions?: ButtonOptions | null, rowOptions?: ButtonRowOptions | null, otherButtons?: HTMLElement[] | null): HTMLElement
    }
}

HTMLElement.prototype.appendButton = function(label: string, options: ButtonOptions | null = null): HTMLButtonElement {
    // debugger
    return this.appendChild(makeButton(label, options))
}
HTMLElement.prototype.appendSubmitButton = function(label: string = 'Submit', options: ButtonOptions | null = null): HTMLButtonElement {
    return this.appendChild(makeSubmitButton(label, options))
}

HTMLElement.prototype.appendButtonRow = function(buttons: HTMLElement[], options: ButtonRowOptions | null = null): HTMLElement {
    return this.appendChild(makeButtonRow(buttons, options))
}
HTMLElement.prototype.appendSubmitRow = function(label: string = 'Submit', submitOptions: ButtonOptions | null = null, rowOptions: ButtonOptions | null = null, otherButtons: HTMLElement[] = []): HTMLElement {
    return this.appendChild(makeSubmitRow(label, submitOptions, rowOptions, otherButtons))
}

export function makeSubmitButton(label: string = 'Submit', options: ButtonOptions | null = null): HTMLButtonElement {
    return makeButton(label, { type: 'submit', colour: 'default-click', ...options })
}
export function makeButton(label: string, options: ButtonOptions | null = null): HTMLButtonElement {
    
    options = { ...new ButtonOptions(), ...options }
    
    const classNames = [ 'form-row-button ', 'form-field-row-button-color-' + options.colour ]
    if (options.classes != null) { classNames.push(options.classes) }
    if (options.thin == true) { classNames.push('form-field-row-thin') }
    if (options.spaceAfter == true) { classNames.push('form-field-row-space-after') }
    if (options.stackedIcon == true) { classNames.push('form-field-row-stacked-icon') }
    if (options.round == true) {
        options.labelAsTitle = true
        classNames.push('form-field-row-button-round')
    }
    
    const button = makeElement<HTMLButtonElement>('button', { ...(options.htmlAttributes || {}), type: options.type, class: classNames.join(' ') })
    if (options.icon) { button.appendIcon(options.icon, { class: 'left-icon' }) }
    if (label && options.labelAsTitle !== true) { button.appendElement('span', { class: 'label', html: label }) }
    if (options.iconRight) { button.appendIcon(options.iconRight, { class: 'right-icon' }) }
    if (options.labelAsTitle == true) { button.title = label }

    if (options.url != null) {
        button.addEventListener('click', () => { if (options?.url != null) { location.href = options.url } })
    }
    if (options.click) {
        button.addEventListener('click', (event: Event) => { if (options?.click) { options.click({ event, button }) } })
    }

    button.addEventListener('keydown', formKeyPressCancelIfKeyRegistered)
    button.addEventListener('keyup', formKeyPressCancelIfKeyRegistered)
    button.addEventListener('focus', formElementFocused)
    button.addEventListener('blur', formElementLostFocused)
    if (window.formKeyPresses == null) {
        window.formKeyPresses = []
        window.addEventListener('keydown', formKeyPressDown)
        window.addEventListener('keyup', formKeyPressUp)
    }
    if (options.clickKey != null) {
        window.formKeyPresses.push({ button: button, key: options.clickKey })
    }

    return button
}

export function makeSubmitRow(label: string = 'Submit', submitOptions: ButtonOptions | null = null, rowOptions: ButtonRowOptions | null = null, otherButtons: HTMLElement[] = []): HTMLElement {
    return makeButtonRow([ ...otherButtons, makeSubmitButton(label, submitOptions) ], rowOptions)
}
export function makeButtonRow(buttons: HTMLElement[], options: ButtonRowOptions | null = null): HTMLElement {
    
    options = { ...new ButtonRowOptions(), ...options }

    const classNames = ['form-field-row-buttons']
    if (options.classes != null) { classNames.push(options.classes) }
    if (options.thin == true) { classNames.push('form-field-row-thin') }
    if (options.tight == true) { classNames.push('form-field-row-tight') }

    const e = makeElement('form-field-row', { ...(options.htmlAttributes || {}), class: classNames.join(' '), style: `justify-content:${options.justify};` })
    buttons.forEach(b => {
        e.appendChild(b)
    })
    return e
}

function removeDeletedFormKeyPressButtons() {
    window.formKeyPresses = (window.formKeyPresses ?? []).filter(p => p.button.isConnected)
}

export function formKeyPressCancelIfKeyRegistered(event: KeyboardEvent) {
    removeDeletedFormKeyPressButtons()
    const keyRegistrations = (window.formKeyPresses ?? []).filter(p => p.key == event.key)
    if (keyRegistrations.length > 0) {
        event.preventDefault()
    }
}

function formKeyPressDown(event: KeyboardEvent) {
    let keyFound = false
    window.formKeyPresses?.filter(p => p.key == event.key && p.button.isConnected && p.button.inAccessibilityTree()).forEach(keyPress => {
        keyPress.button.setKeyActive(true)
        keyFound = true
    })
    if (!keyFound && (event.key == ' ' || event.key == 'Enter')) {
        if (window.formFocusedElement instanceof HTMLButtonElement) {
            window.formFocusedElement.setKeyActive(true)
        }
    }
}
function formKeyPressUp(event: KeyboardEvent) {
    let keyFound = false
    window.formKeyPresses?.filter(p => p.key == event.key && p.button.isConnected && p.button.inAccessibilityTree()).forEach(keyPress => {
        if (keyPress.button.keyActive()) {
            keyPress.button.setKeyActive(false)
        } else {
            keyPress.button.setKeyActive(true)
            setTimeout(() => keyPress.button.setKeyActive(false), 200)
        }
        event.preventDefault()
        event.stopImmediatePropagation()
        keyPress.button.click()
        keyFound = true
    })
    if (event.key == ' ' || event.key == 'Enter') {
        if (window.formFocusedElement instanceof HTMLButtonElement) {
            if (!keyFound) {
                if (window.formFocusedElement.keyActive()) {
                    window.formFocusedElement.setKeyActive(false)
                    window.formFocusedElement.setKeyActive(false)
                } else {
                    const focusedButton = window.formFocusedElement
                    focusedButton.setKeyActive(true)
                    setTimeout(() => focusedButton.setKeyActive(false), 200)
                }
            }
        }
    }
}

declare global {
    interface HTMLButtonElement {
        keyActive(): boolean
        setKeyActive(active: boolean): void
    }
}
HTMLButtonElement.prototype.keyActive = function(): boolean {
    return this.containsClass('key-active')
}
HTMLButtonElement.prototype.setKeyActive = function(active: boolean): void {
    this.toggleClassIfTrue('key-active', active)
}

function formElementFocused(event: Event) {
    if (event.target instanceof HTMLElement) {
        window.formFocusedElement = event.target
    }
}
function formElementLostFocused(event: Event) {
    if (event.target instanceof HTMLElement && event.target == window.formFocusedElement) {
        window.formFocusedElement = undefined
    }
}

declare global {
    interface HTMLButtonElement {
        disableWithSpinIcon(newLabel?: string | null, onLeft?: boolean): void
        disableWithTick(newLabel?: string | null, onLeft?: boolean): void
        disableWithError(newLabel?: string | null, onLeft?: boolean): void
        disableWithIcon(icon: Icon, newLabel?: string | null, onLeft?: boolean): void
        disableWithIcons(iconLeft: Icon | null, iconRight?: Icon | null, newLabel?: string | null): void
        disableWithLabel(newLabel: string): void
        changeIcon(icon: Icon, newLabel?: string | null, onLeft?: boolean): void
        changeIcons(iconLeft: Icon | null, iconRight: Icon | null, newLabel: string | null): void
        changeLabel(newLabel: string): void

        disable(): void
        enable(): void
        toggleEnabled(): void
        toggleEnabledIfTrue(on: boolean): void

        restoreIcons(): void
        restoreLabel(): void
        canRestore(): boolean
    }
}
HTMLButtonElement.prototype.disableWithSpinIcon = function(newLabel: string | null = null, onLeft: boolean = true): void {
    this.disableWithIcon(new SolidIcon('spinner', { animation: new SpinPulseAnimation() }), newLabel, onLeft)
}
HTMLButtonElement.prototype.disableWithTick = function(newLabel: string | null = null, onLeft: boolean = true): void {
    this.disableWithIcon(new Icon('check'), newLabel, onLeft)
}
HTMLButtonElement.prototype.disableWithError = function(newLabel: string | null = null, onLeft: boolean = true): void {
    this.disableWithIcon(new Icon('circle-exclamation'), newLabel, onLeft)
}
HTMLButtonElement.prototype.disableWithIcon = function(icon: Icon, newLabel: string | null = null, onLeft: boolean = true): void {
    this.disableWithIcons(onLeft ? icon : null, onLeft ? null : icon, newLabel)
}
HTMLButtonElement.prototype.disableWithIcons = function(iconLeft: Icon | null = null, iconRight: Icon | null = null, newLabel: string | null = null): void {
    this.disabled = true
    this.changeIcons(iconLeft, iconRight, newLabel)
}
HTMLButtonElement.prototype.disableWithLabel = function(newLabel: string): void {
    this.disabled = true
    this.changeLabel(newLabel)
}
HTMLButtonElement.prototype.changeIcon = function(icon: Icon, newLabel: string | null = null, onLeft: boolean = true): void {
    this.changeIcons(onLeft ? icon : null, onLeft ? null : icon, newLabel)
}
HTMLButtonElement.prototype.changeIcons = function(iconLeft: Icon | null = null, iconRight: Icon | null = null, newLabel: string | null = null): void {
    
    if (iconLeft) {
        const existing = firstOfClassOrNull('left-icon temporary-icon', this)
        if (existing) {
            existing.remove()
        }
        const newIcon = makeIcon(iconLeft, { class: 'left-icon temporary-icon' })
        if (this.childElementCount == 0) {
            this.append(newIcon)
        } else {
            this.insertBefore(newIcon, this.firstChild)
        }
    }
    if (iconRight) {
        const existing = firstOfClassOrNull('right-icon temporary-icon', this)
        if (existing) {
            existing.remove()
        }
        this.appendIcon(iconRight, { class: 'right-icon temporary-icon' })
    }

    this.addClass('show-temporary-icons')
    
    if (newLabel != null) {
        this.changeLabel(newLabel)
    }
}
HTMLButtonElement.prototype.changeLabel = function(newLabel: string): void {
    const label = firstOfClassOrNull('label', this)
    if (label) {
        this.setAttribute('oldLabel', label.html())
        label.html(newLabel)
    }
}
HTMLButtonElement.prototype.disable = function(): void {
    this.disabled = true
}
HTMLButtonElement.prototype.enable = function(): void {
    this.disabled = false
    this.restoreIcons()
}
HTMLButtonElement.prototype.toggleEnabled = function(): void {
    if (this.disabled) {
        this.enable()
    } else {
        this.disable()
    }
}
HTMLButtonElement.prototype.toggleEnabledIfTrue = function(on: boolean): void {
    if (on) {
        this.enable()
    } else {
        this.disable()
    }
}

HTMLButtonElement.prototype.restoreIcons = function(): void {
    Array.from(this.getElementsByClassName('temporary-icon')).forEach(icon => {
        icon.remove()
    })
    this.removeClass('show-temporary-icons')
    this.restoreLabel()
}
HTMLButtonElement.prototype.restoreLabel = function(): void {
    const label = firstOfClassOrNull('label', this)
    if (label) {
        label.html(this.getAttribute('oldLabel'))
        this.removeAttribute('oldLabel')
    }
}
HTMLButtonElement.prototype.canRestore = function(): boolean {
    return firstOfClassOrNull('temporary-icon') ?? this.hasAttribute('oldLabel')
}


declare global {
    interface HTMLElement {
        activateFormRow(): HTMLElement
    }
}
HTMLElement.prototype.activateFormRow = function(): HTMLElement {

    if (this.id != '') {

        if (document.querySelectorAll(`[id=${this.id}]`).length > 1) {
            throw new Error(`Multiple ids matching ${this.id}`)
        }
        
        const input = firstOfTagOrNull<HTMLInputElement>('input', this)
        if (input) {
            input.inputChange(undefined)
        }
    }
    
    return this
}

declare global {
    interface HTMLInputElement {
        inputChange(callback: ((element: HTMLElement) => void) | undefined): void
    }
}
HTMLInputElement.prototype.inputChange = function(callback: ((element: HTMLElement) => void) | undefined): void {

    let shouldCallback = false

    if (this.type == 'checkbox') {
        shouldCallback = true
        this.parentOfType('form-field-row')?.toggleClassIfTrue('form-field-row-checkbox-checked', this.checked)
        this.parentOfType('form-field-row')?.toggleClassIfTrue('form-field-row-checkbox-unchecked', !this.checked)
    } else {
        const row = this.parentOfType('form-field-row')
        if (row) {
            let valueSpan = firstOfClassOrNull('value-span', row)
            if (!valueSpan) {
                valueSpan = row.appendElement('span', { class: 'value-span' })
                valueSpan.ariaHidden = 'true'
            }
            
            if (this.value != valueSpan.innerHTML) {
                shouldCallback = true
            }
            valueSpan.html(this.value)

            const formRowStyle = new FormRowStyle()
            if (row.containsClass(formRowStyle.underline) || row.containsClass(formRowStyle.inlineBorder) || row.containsClass(formRowStyle.frameless)) {
                if (this.value) {
                    let additionalSpace = 16
                    if (this.type == 'number') { additionalSpace = 26 }
                    this.style.width = (valueSpan.offsetWidth + additionalSpace) + 'px'
                } else if (!this.style.width) {
                    this.style.width = '24px'
                }
            }
        }
    }
    
    if (shouldCallback && callback) {
        callback(this)
    }
}