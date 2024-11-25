import { EventAttributes, firstOfClass, firstOfClassOrNull, firstOfTag, firstOfTagOrNull, makeElement } from "./DOM"
import { Icon, SolidIcon, SpinAnimation, makeIcon } from "./Icon";

export type InputType = ('text' | 'number' | 'checkbox');
export class FormElementOptions
{
    style?: FormRowStyleType | null = 'outline';
    inputType?: InputType | null = null;
    name?: string | null = null;
    label?: string | null = null;
    labelRight?: string | null = null;
    secondaryLabel?: string | null = null;
    secondaryLabelRight?: string | null = null;
    value?: any = null;
    icon?: Icon | null = null;
    iconRight?: Icon | null = null;
    secondaryIcon?: Icon | null = null;
    secondaryIconRight?: Icon | null = null;
    selectOptions?: HTMLOptionElement[] | null = null;
    dataList?: string[] | null = null;
    dataType?: string | null = null;
    classes?: string = '';
    withSelectHandle?: boolean = false;
    required?: boolean = false;
    requiredStarOnRight?: boolean = false;
    changed?: (element: HTMLElement) => void | undefined = undefined;
    validationMessages?: ValidationTypes = {};
    maxLength?: number | null = null;
    minimum?: number | null = null;
    maximum?: number | null = null;
}

export interface ValidationTypes
{
    required?: string,
    number?: string,
    checked?: string,
    range?: string,
    rangeMin?: string,
    rangeMax?: string,
    regex?: string,
    regexPattern?: string,
    currency?: string,
    compare?: string,
    compareTo?: string,
    compareOperand?: string,
    datedropdownsrequired?: string,
    datedropdownsrequiredMonthid?: string,
    datedropdownsrequiredYearid?: string,
    ccdateinpast?: string,
    ccdateinpastYearid?: string,
    other?: string,
}

export class ButtonOptions
{
    type?: ('button' | 'submit') = 'button';
    colour?: ('grey' | 'default-click' | 'green' | 'red' | 'transparent') = 'grey';
    thin?: boolean = false;
    spaceAfter?: boolean = false;
    classes?: string = '';
    icon?: Icon | null = null;
    iconRight?: Icon | null = null;
    click?: (button: HTMLButtonElement) => void | undefined = undefined;
    htmlAttributes?: Record<string, string | null> = undefined;
}

export class ButtonRowOptions
{
    justify?: ('flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly') = 'flex-end';
    thin?: boolean = false;
    tight?: boolean = false;
    classes?: string = '';
    htmlAttributes?: Record<string, string | null> = undefined;
}

export type FormRowStyleType = ('outline' | 'outlineInset' | 'blockRow' | 'underline' | 'underlineHover' | 'inlineBorder' | 'inlineBorderHover' | 'frameless');
export class FormRowStyle
{
    outline: string = 'form-field-row-style-outline';
    outlineInset: string = 'form-field-row-style-outline form-field-row-style-outline-inset';
    blockRow: string = 'form-field-row-style-block-row';
    underline: string = 'form-field-row-style-underline';
    underlineHover: string = 'form-field-row-style-underline form-field-row-style-underline-hover';
    inlineBorder: string = 'form-field-row-style-inline-border';
    inlineBorderHover: string = 'form-field-row-style-inline-border form-field-row-style-inline-border-hover';
    frameless: string = 'form-field-row-style-frameless';
}

declare global { interface HTMLElement {
    appendFormRow(id: string, options: FormElementOptions): HTMLElement;
    appendFieldSet(label: string, fields: HTMLElement[]): HTMLElement;
} }
HTMLElement.prototype.appendFormRow = function (id: string, options: FormElementOptions): HTMLElement {
    return this.appendChild(makeFormRow(id, options)).activateFormRow();
}
HTMLElement.prototype.appendFieldSet = function (label: string, fields: HTMLElement[]): HTMLElement {
    return this.appendChild(makeFieldSet(label, fields));
}

export function makeFormRow(id: string, options: FormElementOptions): HTMLElement {
    
    options = { ...new FormElementOptions(), ...options }
    if (!options.validationMessages) { options.validationMessages = {}; } //this line should not be hit, but causes compliation errors

    let type: (InputType | 'select') = options.inputType ?? 'text';
    if (options.inputType == null && options.value != null) {
        if (typeof(options.value) == 'boolean') { type = 'checkbox'; }
        if (typeof(options.value) == 'number') { type = 'number'; }
    }
    if (options.selectOptions) { type = 'select'; }

    let classNames = [ `form-field-row-${type}` ];
    if (options.classes) { classNames.push(options.classes); }
    if ((type == 'number' || type == 'checkbox') && options.style == 'outline') { 
        options.style = 'outlineInset';
    }
    if (options.style) {
        classNames.push(new FormRowStyle()[options.style]);
    }

    if (options.required) { options.validationMessages.required = `Field is required.`; }
    if (type == 'number') { options.validationMessages.number = `Field value must be a number`; }
    if (options.minimum || options.maximum) {
        if (options.minimum && options.maximum) { options.validationMessages.range = `Field value must be between ${options.minimum} and ${options.maximum}.`; }
        if (options.minimum && options.maximum == null) { options.validationMessages.range = `Field value must be greater than ${options.minimum}.`; }
        if (options.minimum == null && options.maximum) { options.validationMessages.range = `Field value must be less than ${options.minimum}.`; }
        if (options.minimum) { options.validationMessages.rangeMin = `${options.minimum}`; }
        if (options.maximum) { options.validationMessages.rangeMax = `${options.maximum}`; }
    }
    let dataAttr: Record<string, string> = {};
    if (type == 'number') {
        dataAttr['type'] = 'float';
    }
    if (options.dataType) {
        dataAttr['type'] = options.dataType;
    }
    if (Object.keys(options.validationMessages).length > 0) {
        dataAttr['val'] = 'true';
        Object.keys(options.validationMessages).forEach((key) => {
            dataAttr['val'] = 'true';
            let value = (options.validationMessages as any)[key];
            if (value !== null) {
                dataAttr[`val-${key}`] = value;
            }
        });
    }

    let div = makeElement('form-field-row', { id: `formfieldrow_${id}`, class: classNames.join(' ') });
    
    let primaryLabel = makeElement('span', { class: 'primary-label' });
    if (options.secondaryIcon) { options.secondaryIcon.fixedWidth = true; primaryLabel.appendIcon(options.secondaryIcon); }
    if (options.label) { primaryLabel.appendElement('span', { html: options.label }); }
    if (options.required == true && options.requiredStarOnRight == false) { primaryLabel.appendElement('span', { class: 'required-star', title: options.validationMessages['required'] ? options.validationMessages['required'] : '', html: '*' }); }
    
    let secondaryLabel = makeElement('span', { class: 'secondary-label' });
    if (options.icon) { options.icon.fixedWidth = true; secondaryLabel.appendIcon(options.icon); }
    if (options.secondaryLabel) { secondaryLabel.appendElement('span', { html: options.secondaryLabel }); }
    
    let label = div.appendElement('label', { class: 'label-left', for: id })
    if (secondaryLabel.innerHTML) { label.appendChild(secondaryLabel); }
    if (primaryLabel.innerHTML) { label.appendChild(primaryLabel); }

    div.appendElement('div', { id: `${id}_validation_message`, class: 'validation-message' });

    if (type != 'select') {
        let valueOutput = options.value;
        let checkedOutput: boolean | undefined = undefined;
        let inputClass = '';
        if (type == 'checkbox') { 
            valueOutput = null;
            checkedOutput = options.value;
            inputClass = 'switch';
        }
        else if (options.dataList) {
            let datalist = div.appendElement('datalist', { id: `${id}_datalist` });
            options.dataList.forEach(d => {
                datalist.appendElement('option', { value: d });
            });
        }

        let input = makeElement<HTMLInputElement>('input', {
            type: type, id: id, name: options.name ?? id,
            class: inputClass,
            value: valueOutput,
            maxlength: options.maxLength,
            list: options.dataList ? `${id}_datalist` : undefined,
            data: dataAttr,
            bool: { checked: checkedOutput }
        });

        if (type == 'checkbox') {
            let label = div.appendElement('label', { class: 'switch-wrapper', for: id })
            label.appendChild(input);
            label.appendElement('div', { class: 'focus-ring' });
        } else {
            div.appendChild(input);
            div.appendElement('div', { class: 'focus-ring' });
        }

        input.addEventListener('keyup', () => { input.inputChange(options.changed) });
        input.addEventListener('change', () => { input.inputChange(options.changed) });
        input.addEventListener('cut', () => setTimeout(() => { input.inputChange(options.changed) }));
        input.addEventListener('paste', () => setTimeout(() => { input.inputChange(options.changed) }));
        input.addEventListener('blur', () => { input.inputChange(options.changed) });
    }
    else if (options.selectOptions) {
        let select = div.appendElement('select', { id: id, name: options.name ?? id, data: dataAttr }) as HTMLSelectElement;
        options.selectOptions?.forEach(o => {
            select.options.add(o);
        });
        div.appendElement('div', { class: 'focus-ring' });
        div.appendElement('div', { class: `select-value-display${options.withSelectHandle ? ' with-handle' : ''}`, html: options.selectOptions.find(o => o.selected)?.text ?? options.selectOptions[0].text });
        
        select.addEventListener('change', (e: Event) => { if (e.target instanceof HTMLSelectElement && e.target.nextSibling?.nextSibling instanceof HTMLElement) { e.target.nextSibling.nextSibling.innerHTML = e.target.options[e.target.selectedIndex].text; } });
        if (options.changed) {
            select.addEventListener('change', () => { options.changed ? options.changed(select) : 0; });
        }
    }

    let primaryLabelRight = makeElement('span', { class: 'primary-label' });
    if (options.required == true && options.requiredStarOnRight == true) { primaryLabelRight.appendElement('span', { class: 'required-star', title: options.validationMessages['required'] ? options.validationMessages['required'] : '', html: '*' }); }
    if (options.labelRight) { primaryLabelRight.appendElement('span', { html: options.labelRight }); }
    if (options.secondaryIconRight) { options.secondaryIconRight.fixedWidth = true; primaryLabelRight.appendIcon(options.secondaryIconRight); }
    
    let secondaryLabelRight = makeElement('span', { class: 'secondary-label' });
    if (options.secondaryLabelRight) { secondaryLabelRight.appendElement('span', { html: options.secondaryLabelRight }); }
    if (options.iconRight) { options.iconRight.fixedWidth = true; secondaryLabelRight.appendIcon(options.iconRight); }
    
    let labelRight = div.appendElement('label', { class: 'label-right', for: id })
    if (primaryLabelRight.innerHTML) { labelRight.appendChild(primaryLabelRight); }
    if (secondaryLabelRight.innerHTML) { labelRight.appendChild(secondaryLabelRight); }

    return div;
}

export function makeFieldSet(legend: string, fields: HTMLElement[], overrideFieldStyle: FormRowStyleType = 'blockRow'): HTMLElement {

    let formRowStyle = new FormRowStyle();

    let styles = Object.values(formRowStyle).reverse();
    fields.forEach(field => {
        styles.forEach(style => {
            field.className = field.className.replace(style, formRowStyle[overrideFieldStyle])
        });
    });

    let e = makeElement('form-field-set');
    e.appendElement('div', { class: 'label', html: legend });
    fields.forEach(f => {
        e.appendChild(f);
        if (f.tagName.toLowerCase() == 'form-field-row') {
            f.activateFormRow();
        }
    });
    return e;
}



declare global { interface HTMLElement {
    appendButton(label: string): HTMLButtonElement;
    appendButton(label: string, options: ButtonOptions): HTMLButtonElement;
    appendSubmitButton(): HTMLButtonElement;
    appendSubmitButton(label: string): HTMLButtonElement;
    appendSubmitButton(label: string, options: ButtonOptions): HTMLButtonElement;

    appendButtonRow(buttons: HTMLElement[]): HTMLElement;
    appendButtonRow(buttons: HTMLElement[], options: ButtonRowOptions): HTMLElement;
    appendSubmitRow(): HTMLElement;
    appendSubmitRow(label: string): HTMLElement;
    appendSubmitRow(label: string, submitOptions: ButtonOptions): HTMLElement;
    appendSubmitRow(label: string, submitOptions: ButtonOptions, rowOptions: ButtonRowOptions): HTMLElement;
    appendSubmitRow(label: string, submitOptions: ButtonOptions, rowOptions: ButtonRowOptions, otherButtons: HTMLElement[]): HTMLElement;
} }

HTMLElement.prototype.appendButton = function (label: string, options: ButtonOptions | null = null): HTMLButtonElement {
    // debugger
    return this.appendChild(makeButton(label, options));
}
HTMLElement.prototype.appendSubmitButton = function (label: string = 'Submit', options: ButtonOptions | null = null): HTMLButtonElement {
    return this.appendChild(makeSubmitButton(label, options));
}

HTMLElement.prototype.appendButtonRow = function (buttons: HTMLElement[], options: ButtonRowOptions | null = null): HTMLElement {
    return this.appendChild(makeButtonRow(buttons, options));
}
HTMLElement.prototype.appendSubmitRow = function (label: string = 'Submit', submitOptions: ButtonOptions | null = null, rowOptions: ButtonOptions | null = null, otherButtons: HTMLElement[] = []): HTMLElement {
    return this.appendChild(makeSubmitRow(label, submitOptions, rowOptions, otherButtons));
}

export function makeSubmitButton(label: string = 'Submit', options: ButtonOptions | null = null): HTMLButtonElement {
    return makeButton(label, { type: 'submit', colour: 'default-click', ...options });
}
export function makeButton(label: string, options: ButtonOptions | null = null): HTMLButtonElement {
    
    options = { ...new ButtonOptions(), ...options }
    
    let classNames = [ 'form-row-button ', 'form-field-row-button-color-' + options.colour ];
    if (options.classes) { classNames.push(options.classes); }
    if (options.thin) { classNames.push('form-field-row-thin'); }
    if (options.spaceAfter) { classNames.push('form-field-row-space-after') }
    
    let button = makeElement<HTMLButtonElement>('button', { ...(options.htmlAttributes || {}), type: options.type, class: classNames.join(' ') });
    if (options.icon) { button.appendIcon(options.icon, { class: 'left-icon' }); }
    if (label) { button.appendElement('span', { class: 'label', html: label }); }
    if (options.iconRight) { button.appendIcon(options.iconRight, { class: 'right-icon' }); }

    if (options.click) {
        button.addEventListener('click', (e: Event) => { if (options?.click) { options.click(button) } });
    }

    return button
}

export function makeSubmitRow(label: string = 'Submit', submitOptions: ButtonOptions | null = null, rowOptions: ButtonRowOptions | null = null, otherButtons: HTMLElement[] = []): HTMLElement {
    return makeButtonRow([ ...otherButtons, makeSubmitButton(label, submitOptions) ], rowOptions);
}
export function makeButtonRow(buttons: HTMLElement[], options: ButtonRowOptions | null = null): HTMLElement {
    
    options = { ...new ButtonRowOptions(), ...options }

    let classNames = [ 'form-field-row-buttons' ];
    if (options.classes) { classNames.push(options.classes); }
    if (options.thin) { classNames.push('form-field-row-thin'); }
    if (options.tight) { classNames.push('form-field-row-tight'); }

    let e = makeElement('form-field-row', { ...(options.htmlAttributes || {}), class: classNames.join(' '), style: `justify-content:${options.justify};` });
    buttons.forEach(b => {
        e.appendChild(b);
    });
    return e;
}



declare global { interface HTMLButtonElement {
    disableWithSpinIcon(): void;
    disableWithSpinIcon(newLabel: string | null): void;
    disableWithSpinIcon(newLabel: string | null, onLeft: boolean): void;
    disableWithTick(): void;
    disableWithTick(newLabel: string | null): void;
    disableWithTick(newLabel: string | null, onLeft: boolean): void;
    disableWithIcon(icon: Icon): void;
    disableWithIcon(icon: Icon, newLabel: string | null): void;
    disableWithIcon(icon: Icon, newLabel: string | null, onLeft: boolean): void;
    disableWithIcons(iconLeft: Icon | null): void;
    disableWithIcons(iconLeft: Icon | null, iconRight: Icon | null): void;
    disableWithIcons(iconLeft: Icon | null, iconRight: Icon | null, newLabel: string | null): void;
    disableWithLabel(newLabel: string): void;

    changeIcon(icon: Icon): void;
    changeIcon(icon: Icon, newLabel: string | null): void;
    changeIcon(icon: Icon, newLabel: string | null, onLeft: boolean): void;
    changeIcons(iconLeft: Icon | null, iconRight: Icon | null, newLabel: string | null): void;
    changeLabel(newLabel: string): void;

    enable(): void;
    restoreIcons(): void;
    restoreLabel(): void;
    canRestore(): boolean;
} }
HTMLButtonElement.prototype.disableWithSpinIcon = function (newLabel: string | null = null, onLeft: boolean = true): void {
    this.disableWithIcon(new SolidIcon('spinner', { animation: new SpinAnimation() }), newLabel, onLeft);
}
HTMLButtonElement.prototype.disableWithTick = function (newLabel: string | null = null, onLeft: boolean = true): void {
    this.disableWithIcon(new Icon('check'), newLabel, onLeft);
}
HTMLButtonElement.prototype.disableWithIcon = function (icon: Icon, newLabel: string | null = null, onLeft: boolean = true): void {
    this.disableWithIcons(onLeft ? icon : null, onLeft ? null : icon, newLabel);
}
HTMLButtonElement.prototype.disableWithIcons = function (iconLeft: Icon | null = null, iconRight: Icon | null = null, newLabel: string | null = null): void {
    this.disabled = true;
    this.changeIcons(iconLeft, iconRight, newLabel);
}
HTMLButtonElement.prototype.disableWithLabel = function (newLabel: string): void {
    this.disabled = true;
    this.changeLabel(newLabel);
}
HTMLButtonElement.prototype.changeIcon = function (icon: Icon, newLabel: string | null = null, onLeft: boolean = true): void {
    this.changeIcons(onLeft ? icon : null, onLeft ? null : icon, newLabel);
}
HTMLButtonElement.prototype.changeIcons = function (iconLeft: Icon | null = null, iconRight: Icon | null = null, newLabel: string | null = null): void {
    
    if (iconLeft) {
        let existing = firstOfClassOrNull('left-icon temporary-icon', this);
        if (existing) {
            existing.remove();
        }
        let newIcon = makeIcon(iconLeft, { class: 'left-icon temporary-icon' });
        if (this.childElementCount == 0) {
            this.append(newIcon)
        } else {
            this.insertBefore(newIcon, this.firstChild);
        }
    }
    if (iconRight) {
        let existing = firstOfClassOrNull('right-icon temporary-icon', this);
        if (existing) {
            existing.remove();
        }
        this.appendIcon(iconRight, { class: 'right-icon temporary-icon' });
    }

    this.addClass('show-temporary-icons');
    
    if (newLabel) {
        this.changeLabel(newLabel);
    }
}
HTMLButtonElement.prototype.changeLabel = function (newLabel: string): void {
    let label = firstOfClassOrNull('label', this);
    if (label) {
        (this as any).oldLabel = label.html();
        label.html(newLabel);
    }
}
HTMLButtonElement.prototype.enable = function (): void {
    this.disabled = false;
    this.restoreIcons();
}
HTMLButtonElement.prototype.restoreIcons = function (): void {
    Array.prototype.slice.call(this.getElementsByClassName('temporary-icon')).forEach(icon => {
        icon.remove();
    });
    this.removeClass('show-temporary-icons');
    this.restoreLabel();
}
HTMLButtonElement.prototype.restoreLabel = function (): void {
    let label = firstOfClassOrNull('label', this);
    if (label) {
        label.html((this as any).oldLabel);
        delete (this as any).oldLabel;
    }
}
HTMLButtonElement.prototype.canRestore = function (): boolean {
    return firstOfClassOrNull('temporary-icon') || (this as any).oldLabel;
}


declare global { interface HTMLElement {
    activateFormRow(): HTMLElement;
} }
HTMLElement.prototype.activateFormRow = function(): HTMLElement {

    if (document.querySelectorAll(`[id=${this.id}]`).length > 1) {
        throw new Error(`Multiple ids matching ${this.id}`);
    }

    let input = firstOfTagOrNull<HTMLInputElement>('input', this);
    if (input) {
        input.inputChange(undefined);
    }
    return this;
}

declare global { interface HTMLInputElement {
    inputChange(callback: ((element: HTMLElement) => void) | undefined): void;
} }
HTMLInputElement.prototype.inputChange = function(callback: ((element: HTMLElement) => void) | undefined): void {

    let shouldCallback = false;

    if (this.type == 'checkbox') {
        shouldCallback = true;
    }
    else {
        let row = this.parentOfType('form-field-row');
        if (row) {
            let valueSpan = firstOfClassOrNull('value-span', row);
            if (!valueSpan) {
                valueSpan = row.appendElement('span', { class: 'value-span' });
                valueSpan.ariaHidden = 'true';
            }

            if (this.value != valueSpan.innerHTML) {
                shouldCallback = true;
            }
            valueSpan.html(this.value)

            let formRowStyle = new FormRowStyle();
            if (row.containsClass(formRowStyle.underline) || row.containsClass(formRowStyle.inlineBorder) || row.containsClass(formRowStyle.frameless)) {
                if (this.value) {
                    let additionalSpace = 16;
                    if (this.type == 'number') { additionalSpace = 26; }
                    this.style.width = (valueSpan.offsetWidth + additionalSpace) + 'px';
                }
                else if (!this.style.width) {
                    this.style.width = '24px';
                }
            }
        }
    }
    
    if (shouldCallback && callback) {
        callback(this);
    }
}