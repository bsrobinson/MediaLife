import { element, elementOrNull } from '../../Scripts/BRLibraries/DOM'
import { FormValidation } from '../../Scripts/BRLibraries/FormValidation';
import { MediaLifeService } from '../../Scripts/Services/~csharpe-services';
import { User } from '../../Scripts/Models/~csharpe-models';

export class LoginIndex {

    service = new MediaLifeService.LoginController();

    constructor() {
        
        elementOrNull('key')?.focus();
        elementOrNull('user_Password')?.focus();
        elementOrNull('user_Name')?.focus();
        
        window.formValidation = new FormValidation();
    }

    login() {

        location.href = '/Login/' + element<HTMLInputElement>('key').value;
        
    }

    createFirstAccount() {
        
        let form = element<HTMLFormElement>('createAccountForm');
        let user = form.toJson<UserForm>().user;

        form.disable();
        this.service.createFirstUser(user).then(response => {
            location.href = '/Login/' + response.data?.password;
        });
    }
}

interface UserForm { user: User }