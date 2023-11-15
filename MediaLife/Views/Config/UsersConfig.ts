import { element } from '../../Scripts/BRLibraries/DOM'
import { UserAccount, User, UserRole } from '../../Scripts/Models/~csharpe-models';
import { MediaLifeService } from '../../Scripts/Services/~csharpe-services';
import '../../Scripts/BRLibraries/Form';
import { makeButton } from '../../Scripts/BRLibraries/Form';

export class UsersConfig {

    users: User[] | null = null;
    accounts: UserAccount[] | null = null;

    service = new MediaLifeService.UsersApiController();

    copyLinkButton: HTMLInputElement | null = null;

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
                    let userRow = table.appendElement('a', { class: 'user', href: 'JavaScript:;', events: { click: () => this.editUser(user.userId) } });
                    userRow.appendElement('div', { class: 'name', html: user.name });
                    userRow.appendElement('div', { class: 'role', html: Object.values(UserRole).at(parseInt(user.role)) })
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

            this.copyLinkButton = makeButton('Copy login link', () => this.copyLoginLink());
            let roleOptions: HTMLOptionElement[] = [];
            for (let i = Object.entries(UserRole).length - 1; i >= 0; i--) { 
                roleOptions.push(new Option(Object.values(UserRole).at(i), i.toString(), i == 0, parseInt(user.role) == i));
            }

            userForm.appendFormRow('name', { label: 'Display Name', value: user.name, isRequired: true });
            userForm.appendFormRow('password', { label: 'Pass Key', value: user.password, isRequired: true });
            userForm.appendFormRow('role', { label: 'Role', type: 'select', options: roleOptions })
            userForm.appendButtonRow([ this.copyLinkButton ], { thin: true });
            userForm.appendElement('input', { type: 'hidden', name: 'userId', value: userId.toString() });
            userForm.appendElement('input', { type: 'hidden', name: 'accountId', value: user.accountId.toString() });
            userForm.appendSubmitRow('Save');

            window.formValidation.addValidator(userForm, true);
        }
    }

    copyLoginLink() {
        let form = element<HTMLFormElement>('user')
        let user = form.toJson<User>();
        let url = window.location;
        navigator.clipboard.writeText(`${url.protocol}//${url.host}/Login/${user.password}`);
        
        if (this.copyLinkButton) {
            this.copyLinkButton.value = 'Copied';
            this.copyLinkButton.disabled = true;
            setTimeout(() => {
                if (this.copyLinkButton) {
                    this.copyLinkButton.value = 'Copy login link';
                    this.copyLinkButton.disabled = false;
                }
            }, 1000);
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