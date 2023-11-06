import { $ } from './BRLibraries/DOM'
import './BRLibraries/DateFormat'
import './BRLibraries/WindowSize'
import './AddToList';
import { EpisodeFileIcon } from './EpisodeFileIcon';
import { EpisodeWatchIcon } from './EpisodeWatchIcon';
import { IconMenu } from './IconMenu';
import { VLCClient } from './Vlc';
import { AddToList } from './AddToList';

declare global {
    interface Window {
        page: any;
        vlc: VLCClient;
        addToListMode: AddToList;
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
        $('burger_menu').toggleClass('open');
        $('site_menu').toggleClass('open');
    }

    openSearch() {
        $('search_row').removeClass('hide');
        $('search_input').focus();
    }
    searchBlur() {
        $('search_row').addClass('hide');
    }

    createCustomList() {
        let name = prompt('List Name:')
        if (name) {
            window.addToListMode.create(name);
        }
    }

    showSnackBar(message: string, error = false) {
        $('snack_bar').removeClass('hide');
        $('snack_bar').toggleClassIfTrue('error', error);
        $('snack_bar_message').innerHTML = message;
    }
    closeSnackBar() {
        $('snack_bar').addClass('hide');
    }

    showProgressBar() {
        $('site_progress_bar').removeClass('hide');
    }
    hideProgressBar() {
        $('site_progress_bar').addClass('hide');
    }

    windowResize() {
        if (window.page?.windowResize) {
            window.page.windowResize();
        }
    }
    
}