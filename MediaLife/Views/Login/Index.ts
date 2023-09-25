import { MediaLife } from '../../Scripts/Site'
import { $ } from '../../Scripts/BRLibraries/DOM'

export class LoginIndex {

    login() {

        location.href = '/Login/' + $<HTMLInputElement>('key').value;
        
    }
    
}