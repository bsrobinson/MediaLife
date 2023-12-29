import { element } from './BRLibraries/DOM'
import './BRLibraries/DateFormat'
import './BRLibraries/WindowSize'
import './AddToList';
import { EpisodeFileIcon } from './EpisodeFileIcon';
import { EpisodeWatchIcon } from './EpisodeWatchIcon';
import { IconMenu } from './IconMenu';
import { VLCClient } from './Vlc';
import { AddToList } from './AddToList';
import { FormValidation } from './BRLibraries/FormValidation';
import { createCookie, readCookie } from './BRLibraries/Cookies';
import { MediaLifeService } from './Services/~csharpe-services';

declare global {
    interface Window {
        page: any;
        vlc: VLCClient;
        addToListMode: AddToList;
        formValidation: FormValidation;
        episodeFileIcons: Record<string, EpisodeFileIcon>;
        episodeWatchIcons: Record<string, EpisodeWatchIcon>;
        iconMenus: Record<string, IconMenu>;
        watchMenuTimeout: NodeJS.Timeout;
        site: MediaLife;
    }
}

export class MediaLife {

    loginService = new MediaLifeService.LoginController();
    
    constructor() {
        
        window.vlc = new VLCClient();
        window.addToListMode = new AddToList();

    }

    toggleSiteMenu() {
        element('burger_menu').toggleClass('open');
        element('site_menu').toggleClass('open');
    }

    toggleUserMenu() {
        let open = 
        element('user_menu_button').toggleClass('open');
        element('user_menu').style.visibility = element('user_menu_button').containsClass('open') ? 'visible' : 'hidden';
        element('user_menu').style.bottom = `calc(100vh - 57px - ${element('user_menu_button').containsClass('open') ? element('user_menu').offsetHeight : '0'}px)`;
    }

    openSearch() {
        element('search_row').removeClass('hide');
        element('search_input').focus();
    }
    searchBlur() {
        element('search_row').addClass('hide');
    }

    createCustomList() {
        let name = prompt('List Name:')
        if (name) {
            window.addToListMode.create(name);
        }
    }

    copyPasskey() {
        let key = readCookie('auth_key');
        if (key) {
            navigator.clipboard.writeText(key);
            this.toggleUserMenu();
        }
    }
    copyLoginLink() {
        let key = readCookie('auth_key');
        let url = window.location;
        if (key) {
            this.toggleUserMenu();
            navigator.clipboard.writeText(`${url.protocol}//${url.host}/Login/${key}`);
        }
    }
    resetPasskey() {
        this.toggleUserMenu();
        if (confirm('Are you sure?\n\nOther devices will be logged out.')) {
            this.loginService.resetPassKey().then(response => {
                if (response.data?.length == 1) {
                    location.href = `/Login/${response.data[0]}`;
                }
            })
        }
    }

    showSnackBar(message: string, error = false) {
        element('snack_bar').removeClass('hide');
        element('snack_bar').toggleClassIfTrue('error', error);
        element('snack_bar_message').innerHTML = message;
    }
    closeSnackBar() {
        element('snack_bar').addClass('hide');
    }

    showProgressBar() {
        element('site_progress_bar').removeClass('hide');
    }
    hideProgressBar() {
        element('site_progress_bar').addClass('hide');
    }
    
}