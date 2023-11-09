import { makeElement } from "./DOM"

export class FormElementOptions
{
    type?: ('text' | 'hidden' | 'checkbox' | 'submit' | 'button' | 'number') | null = 'text';
    name?: string | null = null;
    label?: string | null = null;
    value?: string | null = null;
    shortString?: boolean = false;
    classNames?: string[] = [];
    isRequired?: boolean = false;
    validationMessages?: Record<string, string> = {};
    maxLength?: number | null = null;
    minimum?: number | null = null;
    maximum?: number | null = null;
}

declare global { interface HTMLElement {
    /**
    * Append a new element to the receiver
    * @param {string} htmlElementName - HTMLElement type, for example use `new HTMLDivElement`
    * @param {ElementAttributes} attributes - Attribute name and values
    * @returns {HTMLElement} - Newly created element
    */
    appendFormRow(id: string, options: FormElementOptions): HTMLElement;
    appendButton(label: string): HTMLElement;
    appendButton(label: string, clickEvent: EventListener): HTMLElement;
    appendSubmitButton(): HTMLElement;
    appendSubmitButton(label: string): HTMLElement;
    appendSubmitRow(): HTMLElement;
    appendSubmitRow(label: string): HTMLElement;
    appendButtonRow(buttons: HTMLElement[]): HTMLElement;
    appendFieldSet(label: string, fields: HTMLElement[]): HTMLElement;
} }
HTMLElement.prototype.appendFormRow = function (id: string, options: FormElementOptions): HTMLElement {
    return this.appendChild(makeFormRow(id, options))
}
HTMLElement.prototype.appendButton = function (label: string, clickEvent: EventListener | undefined = undefined): HTMLElement {
    return this.appendChild(makeButton(label, clickEvent));
}
HTMLElement.prototype.appendSubmitButton = function (label: string = 'Submit'): HTMLElement {
    return this.appendChild(makeSubmitButton(label));
}
HTMLElement.prototype.appendSubmitRow = function (label: string = 'Submit'): HTMLElement {
    return this.appendChild(makeSubmitRow(label));
}
HTMLElement.prototype.appendButtonRow = function (buttons: HTMLElement[]): HTMLElement {
    return this.appendChild(makeButtonRow(buttons));
}
HTMLElement.prototype.appendFieldSet = function (label: string, fields: HTMLElement[]): HTMLElement {
    return this.appendChild(makeFieldSet(label, fields));
}


export function makeFormRow(id: string, options: FormElementOptions): HTMLElement {

    options = { ...new FormElementOptions(), ...options }
    if (!options.validationMessages) { options.validationMessages = {}; } //this line should not be hit, but causes compliation errors

    let classNames = [ 'field', ...options.classNames ?? [] ];
    if (options.type == 'number' || options.shortString) { classNames.push('center'); }
    if (options.type == 'checkbox') { classNames.push(options.type); }

    let valueOutput = options.value;
    let checkedOutput: boolean | undefined = undefined;
    if (options.type == 'checkbox') { 
        valueOutput = null;
        checkedOutput = options.value?.toUpperCase().slice(0, 1) == 'T' || options.value == '1'; 
    }

    if (options.isRequired) { options.validationMessages['required'] = `Field is required.`; }
    if (options.type == 'number') { options.validationMessages['number'] = `Field value must be a number`; }
    if (options.minimum || options.maximum)
    {
        if (options.minimum && options.maximum) { options.validationMessages['range'] = `Field value must be between ${options.minimum} and ${options.maximum}.`; }
        if (options.minimum && options.maximum == null) { options.validationMessages['range'] = `Field value must be greater than ${options.minimum}.`; }
        if (options.minimum == null && options.maximum) { options.validationMessages['range'] = `Field value must be less than ${options.minimum}.`; }
        if (options.minimum) { options.validationMessages['range-min'] = `${options.minimum}`; }
        if (options.maximum) { options.validationMessages['range-max'] = `${options.maximum}`; }
    }
    let dataAttr: Record<string, string> = {};
    if (Object.keys(options.validationMessages).length > 0)
    {
        dataAttr['val'] = 'true';
        Object.keys(options.validationMessages).forEach(key => {
            dataAttr['val'] = 'true';
            dataAttr[`val-${key}`] = (options.validationMessages ?? {})[key];
        });
    }

    let div = makeElement('div', { class: classNames.join(' ') });

    let label = div.appendElement('label', { for: id, html: options.label ?? options.name ?? id });
    if (options.type != 'checkbox' && options.isRequired) {
        //* checkboxes will always have a value, so required isn't valid - may want to check if true (this may need work!)
        label.appendElement('span', { class: 'required-star', title: options.validationMessages['required'] ? options.validationMessages['required'] : '', html: '*' });
    }
    div.appendElement('div', { id: `${id}-validation-message`, class: 'validation-message' });
    div.appendElement('input', { type: options.type, id: id, name: options.name ?? id, value: valueOutput, maxlength: options.maxLength, data: dataAttr, bool: { checked: checkedOutput } });

    return div;
}

export function makeButton(label: string, clickEvent: EventListener | undefined = undefined): HTMLElement {
    return makeElement('input', { type: 'button', value: label, events: { click: clickEvent } });
}

export function makeSubmitButton(label: string = 'Submit'): HTMLElement {
    return makeElement('input', { type: 'submit', value: label });
}

export function makeSubmitRow(label: string = 'Submit'): HTMLElement {
    return makeButtonRow([
        makeSubmitButton(label)
    ]);
}

export function makeButtonRow(buttons: HTMLElement[]): HTMLElement {
    let e = makeElement('div', { class: 'field buttons' });
    buttons.forEach(b => {
        e.appendChild(b);
    });
    return e;
}

export function makeFieldSet(label: string, fields: HTMLElement[]): HTMLElement {
    let e = makeElement('div', { class: 'field-set' });
    e.appendElement('div', { class: 'label', html: label });
    fields.forEach(f => {
        e.appendChild(f);
    });
    return e;
}