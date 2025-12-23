import { MediaLife } from '../../Scripts/Site'
import { element, elementsOfClass, firstOfClass } from '../../Scripts/BRLibraries/DOM'
import { MediaLifeService } from '../../Scripts/Services/~csharpe-services';
import { windowSize } from '../../Scripts/BRLibraries/WindowSize';
import { FormValidation } from '../../Scripts/BRLibraries/FormValidation';
import { UsersConfig } from './UsersConfig';
import { TorrentSearchEngineConfig } from './TorrentSearchEngineConfig';
import { TorrentSearchEngine } from '../../Scripts/Models/~csharpe-models';

export class ConfigIndex {

    service = new MediaLifeService.ConfigController();
    usersConfig: UsersConfig | null = null;
    torrentSearchEngineConfig: TorrentSearchEngineConfig | null = null;

    lastHash: string | null = null;

    constructor(private site: MediaLife, private data: TorrentSearchEngine[]) {
    }

    init() {
        setInterval(() => this.monitorHash(), 500);
        if (location.hash == '' && windowSize().w > 600) {
            location.href = firstOfClass<HTMLAnchorElement>('menu-link').href;
        }

        window.formValidation = new FormValidation();
        window.formValidation.validateForms();

    }

    monitorHash() {
        if (location.hash != this.lastHash) {
            element('settings').removeClass('hide');
            
            this.switchPage(location.hash.slice(1))
            this.lastHash = location.hash;
        }
    }
    
    switchPage(pageId: string) {
        
        element('settings').scrollTo({ top: 0, left: pageId == '' ? 0 : 9999, behavior: 'smooth' });

        elementsOfClass<HTMLAnchorElement>('menu-link').forEach(link => {
            let active = link.href.slice(link.href.length - pageId.length - 1) == `#${pageId}`
            link.toggleClassIfTrue('active', active);
            if (active) {
                element('header_page_name').html(link.innerHTML);
            }
        });

        elementsOfClass('content-page').forEach(page => {
            let active = page.id == pageId
            page.toggleClassIfTrue('active', active);
            if (active) {
                if (!page.containsClass('loaded')) {

                    if (pageId == 'accounts') {
                        this.usersConfig = new UsersConfig();
                    }
            
                    if (pageId == 'torrentSearchEngines') {
                        this.torrentSearchEngineConfig = new TorrentSearchEngineConfig();
                    }

                    page.addClass('loaded');
                }
                
                this.usersConfig?.backToAccounts();
            }

        });

    }
    
    saveForm(form: HTMLFormElement) {

        this.site.showProgressBar();
        form.disable();
        
        this.service.update(form.toJson(false, false)).then(_ => {
            form.enable();
            this.site.hideProgressBar();
        });
    }

    windowResize() {
        this.torrentSearchEngineConfig?.draw();
    }

}