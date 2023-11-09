import { element, elementOrNull } from '../../Scripts/BRLibraries/DOM'
import { Account, User } from '../../Scripts/Models/~csharpe-models';
import { MediaLifeService } from '../../Scripts/Services/~csharpe-services';
import '../../Scripts/BRLibraries/Form';

export class UsersConfig {

    users: User[] | null = null;
    accounts: Account[] | null = null;

    service = new MediaLifeService.UsersApiController();

    constructor() {
        this.loadData();
    }

    loadData() {
        
        this.users = null;
        this.accounts = null;

        this.service.getUsers().then(response => {
            this.users = response.data ?? [];
            this.draw();
        });

        this.service.getAccounts().then(response => {
            this.accounts = response.data ?? [];
            this.draw();
        });
    }

    draw() {
        if (this.users && this.accounts) {
            
            let table = element('accounts_table');
            table.innerHTML = '';

            this.accounts.forEach(account => {

                let header = table.appendElement('div', { class: 'account-header' });
                header.appendElement('div', { class: 'label', html: account.name });
                header.appendElement('a', { href: 'JavaScript:;', html: 'rename', events: { click: () => this.renameAccount(account.accountId) } });
                
                this.users?.filter(u => u.accountId == account.accountId).forEach(user => {
                    table.appendElement('a', { class: 'user', href: 'JavaScript:;', html: user.name, events: { click: () => this.editUser(user.userId) } });
                });

                table.appendElement('a', { class: 'user add-link', href: 'JavaScript:;', html: 'Add User', events: { click: () => this.addUser(account.accountId) } });                
            });
        }

        element('accounts_add_link').removeClass('hide');
    }

    addAccount() {

        let username = prompt('Primary user display name for new account');
        if (username) {
            this.service.addAccount(username).then(_ => {
                this.loadData();
            });
        }
    }

    renameAccount(id: number) {

        let account = this.accounts?.find(a => a.accountId == id);

        let name = prompt('Rename account', account?.name);
        if (name) {
            this.service.renameAccount(id, name).then(response => {
                if (response.data && account) {
                    account.name = response.data.name;
                    this.draw();
                }
            });
        }
    }

    addUser(accountId: number) {

        let username = prompt('New user display name');
        if (username) {
            this.service.addUser(accountId, username).then(response => {
                if (response.data && this.users) {
                    this.users.push(response.data);
                    this.draw();
                }
            });
        }
    }

    editUser(userId: number) {

        element('accounts').scrollTo({ top: 0, left: 400, behavior: 'smooth' });

        let userForm = element<HTMLFormElement>('user');
        window.formValidation.removeValidator(userForm);
        element('user').html('');

        let user = this.users?.find(u => u.userId == userId);
        if (user) {

            userForm.appendFormRow('name', { label: 'Display Name', value: user.name, isRequired: true });
            userForm.appendFormRow('password', { label: 'Pass Key', value: user.password, isRequired: true });
            userForm.appendElement('input', { type: 'hidden', name: 'userId', value: userId.toString() });
            userForm.appendElement('input', { type: 'hidden', name: 'accountId', value: user.accountId.toString() });
            userForm.appendSubmitRow('Save');

            window.formValidation.addValidator(userForm, true);
        }
    }

    saveUser() {

        let form = element<HTMLFormElement>('user')
        let user = form.toJson<User>();

        form.disable();

        this.service.editUser(user).then(response => {
            let userIndex = this.users?.findIndex(u => u.userId == response.data?.userId);
            if (response.data && this.users && (userIndex ?? -1) >= 0) {
                this.users[userIndex ?? -1] = response.data;
                this.backToAccounts();
                form.enable();
                this.draw();
            }
        });
    }

    backToAccounts() {

        element('accounts').scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    }
}