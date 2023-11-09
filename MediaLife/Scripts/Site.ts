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
    
    constructor() {
        
        window.vlc = new VLCClient();
        window.addToListMode = new AddToList();

    }

    toggleSiteMenu() {
        element('burger_menu').toggleClass('open');
        element('site_menu').toggleClass('open');
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

    windowResize() {
        if (window.page?.windowResize) {
            window.page.windowResize();
        }
    }
    
}