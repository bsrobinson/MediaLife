import { MediaLife } from '../../Scripts/Site'
import { $, $OrNull } from '../../Scripts/BRLibraries/DOM'
import { PirateBay } from '../../Scripts/Models/~csharpe-models';
import { PirateBayConfig } from './PirateBayConfig';
import { MediaLifeService, ServiceResponse } from '../../Scripts/Services/~csharpe-services';

export class ConfigIndex {

    service = new MediaLifeService.ConfigController();
    pirateBayConfig: PirateBayConfig | null = null;

    pendingForms: Record<string, NodeJS.Timeout> = {};
    formsSaving: number[] = [];

    constructor(private site: MediaLife, private data: PirateBay[]) {
        
    }

    switchPage(event: Event, pageId: string) {

        $('settings').scrollTo(9999, 0);
        $('header_page_name').html((event.target as HTMLElement).innerHTML);

        let menuLinks = document.getElementsByClassName('menu-link')
        for (let i = 0; i < menuLinks.length; i++) {
            (menuLinks[i] as HTMLElement).removeClass('active')
        }
        (event.target as HTMLElement).addClass('active');

        let pages = document.getElementsByClassName('content-page')
        for (let i = 0; i < pages.length; i++) {
            (pages[i] as HTMLElement).removeClass('active')
        }

        let page = $(pageId);

        page.addClass('active');
        if (!page.containsClass('loaded')) {

            if (pageId == 'piratebay') {
                this.pirateBayConfig = new PirateBayConfig();
            }
            
            page.addClass('loaded');
        }

    }

    backToPageMenu() {
        $('settings').scrollTo(0, 0);
    }

    formChanged(form: HTMLFormElement) {

        if (this.pendingForms[form.id]) {
            clearTimeout(this.pendingForms[form.id]);
        }
        
        this.pendingForms[form.id] = setTimeout(() => {
            this.saveForm(form.id);
        }, 500);

    }
    
    saveForm(id: string) {
        
        this.site.showProgressBar();

        let saveId = new Date().valueOf();
        this.formsSaving.push(saveId);

        console.log($<HTMLFormElement>(id).toJson());
        this.service.update($<HTMLFormElement>(id).toJson()).then(response => {

            this.formsSaving.splice(this.formsSaving.findIndex(f => f == saveId), 1);

            if (this.formsSaving.length == 0) {
                this.site.hideProgressBar();
            }
        });
    }

}