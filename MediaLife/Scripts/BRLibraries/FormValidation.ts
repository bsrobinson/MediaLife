import { element, elementOrNull, firstOfClassOrNull, firstOfTagOrNull } from "./DOM";

interface ValidationForm {
    formElement: HTMLFormElement
    fields: ValidationFormField[]
    successCallback: ((ev: SubmitEvent) => any) | undefined
}

interface ValidationFormField {
    fieldElement: HTMLFormElement
    active: boolean
    waitingForGroupMembers: HTMLFormElement[]
}

interface ErrorSummaryLine {
    fieldElement: HTMLFormElement
    message: string
}

export class FormValidation {

    forms: ValidationForm[] = [];
    summaryLines: ErrorSummaryLine[] = [];

    constructor() {
        
        for (let i = 0; i < document.forms.length; i++) {
            this.addValidator(document.forms[i]);
        }

        this.refreshErrorMessages();

    }

    addValidator(form: HTMLFormElement, validate: boolean = false) {

        let formFields: ValidationFormField[] = [];
            
        //Get all data-val fields
        for (let j = 0; j < form.elements.length; j++) {
            let formElement = form.elements[j] as HTMLFormElement;
            if (formElement.getAttribute('data-val') === 'true') {
                formElement.addEventListener('keyup', () => this.activeUpdateValidation(formElement));
                formElement.addEventListener('change', () => this.activeUpdateValidation(formElement));
                formElement.addEventListener('paste', () => this.activeUpdateValidation(formElement));
                formElement.addEventListener('cut', () => this.activeUpdateValidation(formElement));
                formElement.addEventListener('blur', () => this.activeUpdateValidation(formElement));
                formFields.push({ fieldElement: formElement, active: false, waitingForGroupMembers: [] });
            }
        }

        //Find and data-val-other fields and group them to their data-val parent
        for (let j = 0; j < form.elements.length; j++) {
            let formElement = form.elements[j] as HTMLFormElement;
            let otherAttr = formElement.getAttribute('data-val-other')
            if (otherAttr) {
                if (elementOrNull(otherAttr) && element(otherAttr).getAttribute('data-val') === 'true') {
                    let otherElement = element<HTMLFormElement>(otherAttr);
                    formElement.addEventListener('keyup', () => this.activeUpdateValidation(otherElement));
                    formElement.addEventListener('change', () => this.activeUpdateValidation(otherElement));
                    formElement.addEventListener('paste', () => this.activeUpdateValidation(otherElement));
                    formElement.addEventListener('cut', () => this.activeUpdateValidation(otherElement));
                    formElement.addEventListener('blur', () => this.validateGroupField(formElement, otherElement));
                    otherElement.addEventListener('blur', () => this.validateGroupField(formElement, formElement));
                    for (let k = 0; k < formFields.length; k++) {
                        if (formFields[k].fieldElement == otherElement) {
                            if (!formFields[k].waitingForGroupMembers) { formFields[k].waitingForGroupMembers = [ otherElement ]; }
                            formFields[k].waitingForGroupMembers.push(formElement);
                        }
                    }
                }
            }
        }
        
        if (formFields.length > 0) {
            let callback = form.onsubmit?.bind(form);
            let validationForm: ValidationForm = { formElement: form, fields: formFields, successCallback: callback };
            validationForm.formElement.onsubmit = (e: SubmitEvent) => this.formSubmitted(e, validationForm);
            this.forms.push(validationForm);
        }

        if (validate) {
            this.validateForm(form);
        }
    }

    removeValidator(form: HTMLElement) {

        let formIndex = this.forms.findIndex(f => f.formElement == form);
        if (formIndex >= 0) {
            this.forms.splice(formIndex, 1);
        }

    }

    formSubmitted(event: SubmitEvent, form: ValidationForm) {

        let success = this.validateForm(form.formElement);
        if (success && form.successCallback) {
            return form.successCallback(event);
        } 
        else {
            return success;
        }
    }

    validateForms() {
        this.forms.forEach(f => this.validateForm(f.formElement));
    }

    validateForm(formElement: HTMLFormElement): boolean {

        let returnValue = true;
        this.summaryLines = [];

        this.forms.forEach(form => {
            if (form.formElement == formElement) {
                form.fields.forEach(field => {
                    if (!this.validateField(field.fieldElement)) {
                        returnValue = false;
                    }
                });

                let ul: HTMLElement | null = null;
                let summary = firstOfClassOrNull('data-validation-summary', formElement);
                if (summary) {
                    summary.toggleClassIfTrue('hide', this.summaryLines.length == 0);
                    ul = firstOfTagOrNull('ul', summary);
                    if (ul == null) {
                        ul = summary.appendElement('ul');
                    }
                    ul.innerHTML = '';
                }
                if (ul) {
                    this.summaryLines.forEach(line => {
                        ul?.appendElement('li').appendElement('a', { href: 'JavaScript:;', html: line.message, events: { click: () => line.fieldElement.focus() } });
                    });
                }
                
                this.refreshErrorMessages();
            }
        });

        formElement.toggleClassIfTrue('form-validation-error', !returnValue)
        formElement.toggleClassIfTrue('form-validation-success', returnValue)

        return returnValue;
    }

    validateField(fieldElement: HTMLFormElement): boolean | null {

        for (let i = 0; i < this.forms.length; i++) {
            let form = this.forms[i];

            for (let j = 0; j < form.fields.length; j++) {
                let field = form.fields[j];

                if (field.fieldElement == fieldElement) {
                    
                    // if (fieldElement.offsetWidth > 0) { //is visible
                        
                        field.active = true;

                        let fieldValue = fieldElement.value;
                        let htmlValid = fieldElement.reportValidity();
                        if (fieldValue == null && fieldElement.nodeName.toLowerCase() == 'select') {
                            fieldValue = fieldElement.options[fieldElement.selectedIndex].value;
                        }
        
                        let errorMessage = '';
                        
                        //Check required fields
                        let dataValRequired = fieldElement.getAttribute('data-val-required');
                        if (dataValRequired && fieldValue == '') {
                            errorMessage = dataValRequired;
                        }
                        
                        //Check number fields
                        let dataValNumber = fieldElement.getAttribute('data-val-number');
                        if (dataValNumber && ((fieldValue == '' && !htmlValid) || (fieldValue != '' && fieldValue.match(/^(?:-|)[0-9.]+$/) == null))) {
                            errorMessage = dataValNumber;
                        }
                        
                        //Check numeric range fields
                        let dataValRange = fieldElement.getAttribute('data-val-range');
                        if (dataValRange && !Number.isNaN(parseFloat(fieldValue))) {
                            let dataValRangeMin = fieldElement.getAttribute('data-val-range-min');
                            if (dataValRange && dataValRangeMin && !Number.isNaN(parseFloat(dataValRangeMin)) && parseFloat(fieldValue) < parseFloat(dataValRangeMin)) {
                                errorMessage = dataValRange;
                            }
                            let dataValRangeMax = fieldElement.getAttribute('data-val-range-max');
                            if (dataValRange && dataValRangeMax && !Number.isNaN(parseFloat(dataValRangeMax)) && parseFloat(fieldValue) > parseFloat(dataValRangeMax)) {
                                errorMessage = dataValRange;
                            }
                        }
                        
                        //Check regular expression fields
                        if (errorMessage == '') {
                            let dataValRegex = fieldElement.getAttribute('data-val-regex');
                            if (dataValRegex != null) {
                                let dataValRegexPattern = fieldElement.getAttribute('data-val-regex-pattern');
                                if (dataValRegexPattern != null && fieldValue.match(dataValRegexPattern) == null) {
                                    errorMessage = dataValRegex;
                                }
                            }
                        }
        
                        //Check currency fields
                        if (errorMessage == '') {
                            let dataValCurrency = fieldElement.getAttribute('data-val-currency');
                            if (dataValCurrency != null) {
                                if (fieldValue.match(/^[0-9\.]+$/) == null) {
                                    errorMessage = dataValCurrency;
                                }
                            }
                        }
        
                        //Check compare fields
                        if (errorMessage == '') {
                            let dataValCompare = fieldElement.getAttribute('data-val-compare');
                            if (dataValCompare != null) {
                                let dataValCompareTo = fieldElement.getAttribute('data-val-compare-to');
                                let dataValCompareOperand = fieldElement.getAttribute('data-val-compare-operand');
                                if (dataValCompareTo != null && dataValCompareOperand != null && form.formElement[dataValCompareTo]) {
                                    let cmpValue = form.formElement[dataValCompareTo].value;
                                    if (cmpValue == null && form.formElement[dataValCompareTo].nodeName.toLowerCase == 'select') {
                                        cmpValue = form.formElement[dataValCompareTo].options[form.formElement[dataValCompareTo].selectedIndex].value;
                                    }
                                    if (dataValCompareOperand == '<' && !(fieldValue < cmpValue)) { errorMessage = dataValCompare; }
                                    else if (dataValCompareOperand == '<=' && !(fieldValue <= cmpValue)) { errorMessage = dataValCompare; }
                                    else if (dataValCompareOperand == '=' && !(fieldValue = cmpValue)) { errorMessage = dataValCompare; }
                                    else if (dataValCompareOperand == '>' && !(fieldValue >= cmpValue)) { errorMessage = dataValCompare; }
                                    else if (dataValCompareOperand == '>=' && !(fieldValue >= cmpValue)) { errorMessage = dataValCompare; }
                                }
                            }
                        }
                
                        //Check date drop downs required
                        if (errorMessage == '') {
                            let dataValDateDropDownsRequired = fieldElement.getAttribute('data-val-datedropdownsrequired');
                            if (dataValDateDropDownsRequired != null) {
                                let dataValDateDropDownsRequiredMonthId = fieldElement.getAttribute('data-val-datedropdownsrequired-monthid');
                                let dataValDateDropDownsRequiredYearId = fieldElement.getAttribute('data-val-datedropdownsrequired-yearid');
                                if (dataValDateDropDownsRequiredMonthId != null && elementOrNull(dataValDateDropDownsRequiredMonthId) && dataValDateDropDownsRequiredYearId != null && elementOrNull(dataValDateDropDownsRequiredYearId)) {
                                    let monthValue = elementOrNull<HTMLFormElement>(dataValDateDropDownsRequiredMonthId)?.value;
                                    if (monthValue == null) { monthValue = element<HTMLFormElement>(dataValDateDropDownsRequiredMonthId).options[element<HTMLFormElement>(dataValDateDropDownsRequiredMonthId).selectedIndex].value; }
                                    let yearValue = elementOrNull<HTMLFormElement>(dataValDateDropDownsRequiredYearId)?.value;
                                    if (yearValue == null) { yearValue = element<HTMLFormElement>(dataValDateDropDownsRequiredYearId).options[element<HTMLFormElement>(dataValDateDropDownsRequiredYearId).selectedIndex].value; }
                                    if (fieldValue == '' || isNaN(fieldValue) || monthValue == '' || isNaN(monthValue) || yearValue == '' || isNaN(yearValue)) {
                                        errorMessage = dataValDateDropDownsRequired;
                                    }
                                }
                                }
                        }
                        
                        //Check credit card date is in the past
                        if (errorMessage == '') {
                            let dataValCCDateInPast = fieldElement.getAttribute('data-val-ccdateinpast');
                            if (dataValCCDateInPast != null) {
                                let dataValCCDateInPastYearId = fieldElement.getAttribute('data-val-ccdateinpast-yearid');
                                if (dataValCCDateInPastYearId != null && elementOrNull(dataValCCDateInPastYearId)) {
                                    let yearValue = elementOrNull<HTMLFormElement>(dataValCCDateInPastYearId)?.value;
                                    if (yearValue == null) { yearValue = element<HTMLFormElement>(dataValCCDateInPastYearId).options[element<HTMLFormElement>(dataValCCDateInPastYearId).selectedIndex].value; }
                                    if (fieldValue != '' && !isNaN(fieldValue) && yearValue != '' && !isNaN(yearValue)) {
                                        let expiryDate = new Date(parseInt(new Date().getFullYear().toString().slice(0, 2)) + yearValue, fieldValue, new Date().getDate());
                                        if (expiryDate < new Date()) {
                                            errorMessage = dataValCCDateInPast;
                                        }
                                    }
                                }
                            }
                        }
                        
        
        
                        //Output error message
                        if (fieldElement.id && elementOrNull(fieldElement.id + '-validation-message')) {
                            element(fieldElement.id + '-validation-message').innerHTML = errorMessage;
                        }
        
                        //Update field class
                        fieldElement.parentOfClass('field')?.toggleClassIfTrue('input-validation-error', errorMessage != '')
                        fieldElement.toggleClassIfTrue('input-validation-error', errorMessage != '');

                        fieldElement.parentOfClass('field')?.toggleClassIfTrue('input-validation-success', errorMessage == '')
                        fieldElement.toggleClassIfTrue('input-validation-success', errorMessage == '');
                        
                        if (errorMessage != '') {
                            this.summaryLines.push({ message: errorMessage, fieldElement: fieldElement });
                            return false;
                        }
                    // }
                    
                    return true;
                }
            }
        }
    
        return null;
    }

    //This function is used by fields dependant on other fields (i.e. date selections)
    //In these cases only one field is actually validated, and other fields trigger this validation (using data-val-other)
    //Validation doesn't happen until all fields in the group have been attempted by the user
    validateGroupField(fieldElement: HTMLFormElement, mainElement: HTMLFormElement) {
        this.forms.forEach(form => {
            form.fields.forEach(field => {
                if (field.fieldElement == mainElement) {

                    if (field.waitingForGroupMembers.length == 0) {
                        this.validateField(mainElement);
                        this.refreshErrorMessages();
                    } else {
                        for (let k = field.waitingForGroupMembers.length - 1; k >= 0; k--) {
                            if (field.waitingForGroupMembers[k] == fieldElement) {
                                field.waitingForGroupMembers.splice(k, 1);
                            }
                        }
                    }
                }
            });
        });
    }

    activeUpdateValidation(fieldElement: HTMLFormElement) {
        this.forms.forEach(form => {
            form.fields.forEach(field => {
                if (field.fieldElement == fieldElement && field.active) {
                    this.validateField(fieldElement);
                    this.refreshErrorMessages();
                }
            });
        });
    }
    
    refreshErrorMessages() {
        this.forms.forEach(form => {
            form.fields.forEach(field => {
                form.formElement.toggleClassIfTrue('validation-failed', field.fieldElement.containsClass('input-validation-error'))
            });
        });
    }
}