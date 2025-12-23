import { element, elementOrNull, elementsOfClass } from '../../Scripts/BRLibraries/DOM'
import { Icon, SolidIcon } from '../../Scripts/BRLibraries/Icon';
import { TorrentSearchEngine, TorrentSearchEngineType } from '../../Scripts/Models/~csharpe-models';
import { MediaLifeService, ServiceErrorMessage, ServiceResponse } from '../../Scripts/Services/~csharpe-services';

export class TorrentSearchEngineConfig {

    TorrentSearchEngineType = TorrentSearchEngineType

    data: TorrentSearchEngine[] = [];
    service = new MediaLifeService.TorrentSearchEngineApiController();

    constructor() {

        this.service.get().then(response => {

            this.data = response.data ?? [];
            this.draw();
    
            this.data.forEach(item => {
                this.test(item.id);
            });
        });


    }

    draw() {

        let cumulativeTop = 0;

        this.data.forEach(item => {

            let pbUrl = item.url;
            let urlDomainSplit = pbUrl.indexOf('/', 10) + 1;
            let urlDomain = urlDomainSplit > 0 ? pbUrl.slice(0, urlDomainSplit) : item.url;
            let urlPath = urlDomainSplit > 0 ? pbUrl.slice(urlDomainSplit) : '';

            let row = elementOrNull('row_' + item.id);
            if (!row) {

                row = element('torrentSearchEngines_table').appendElement('div', { id: 'row_' + item.id, class: 'row' });

                let div = row.appendElement('div');
                div.appendIcon(new Icon('ellipsis'), { class: 'test-icon' })

                div = div.appendElement('div', { class: 'main-label' });
                let url = div.appendElement('div', { class: 'url' });
                url.appendElement('a', { href: urlDomain, html: urlDomain, target: '_blank' });
                url.appendElement('a', { href: pbUrl, html: urlPath, target: '_blank' });

                const type = TorrentSearchEngineType[item.type]

                if (item.lastSuccess != null && new Date(item.lastSuccess) > new Date(item.lastError || 0)) {
                    div.appendElement('div', { class: 'metrics', html: type + ': Last Success: ' + this.relativeDate(item.lastSuccess) + ' (' + item.resultsInLastRun + ' results)' });
                } else if (item.lastError != null) {
                    div.appendElement('div', { class: 'metrics', html: type + ': Last Error: ' + this.relativeDate(item.lastError) + ' (' + item.consecutiveErrors + ' fails)' });
                } else {
                    div.appendElement('div', { class: 'metrics', html: type });
                }

                let buttons = row.appendElement('div', { style: 'font-size: 1.4rem' });
                buttons.appendIcon(new SolidIcon('circle-check'), { class: 'icon button active', htmlAttributes: { title: 'Active' } });
                buttons.appendIcon(new SolidIcon('circle-check'), { class: 'icon button inactive', click: (e: Event) => this.makeActive(e), htmlAttributes: { title: 'Make Active' } });
                buttons.appendIcon(new Icon('trash-can'), { class: 'icon button', click: (e: Event) => this.deleteEntry(e), htmlAttributes: { title: 'Delete' } });
            }
            row.toggleClassIfTrue('active', item.active);

            row.style.top = cumulativeTop + 'px';
            cumulativeTop += row.offsetHeight * 1.5;
        });

        cumulativeTop += 20
        elementsOfClass('torrentSearchEngines-add-link').forEach(e => {
            e.style.marginTop = (cumulativeTop) + 'px'
            cumulativeTop += 32
        })
        elementsOfClass('torrentSearchEngines-add-link').forEach(e => e.removeClass('hide'))
        element('settings_content').style.minHeight = (cumulativeTop + 160) + 'px'
    }

    relativeDate(dateStr: string) {

        let date = new Date(dateStr);
        let delta = Math.round((+new Date - date.valueOf()) / 1000);

        let minute = 60;
        let hour = minute * 60;
        let day = hour * 24;

        if (delta < 30) {
            return 'Just now';
        } else if (delta < minute) {
            return delta + ' seconds ago';
        } else if (delta < 2 * minute) {
            return 'A minute ago'
        } else if (delta < hour) {
            return Math.floor(delta / minute) + ' minutes ago';
        } else if (Math.floor(delta / hour) == 1) {
            return '1 hour ago'
        } else if (delta < day) {
            return Math.floor(delta / hour) + ' hours ago';
        } else if (delta < day * 2) {
            return 'Yesterday';
        } else {
            let thisYear = date.getFullYear() == new Date().getFullYear();
            return date.format('j F' + (thisYear ? '' : ' Y'));
        }
    }

    test(id: number) {

        element('row_' + id).addClass('testing');

        this.service.test(id, ServiceErrorMessage.None).then(response => {
            if (response.success) {
                element('row_' + id).swapClass('testing', 'test-success');
            } else {
                element('row_' + id).swapClass('testing', 'test-fail');
            }
        });
    }

    addPirateBay() {
        let url = prompt('Enter new Pirate Bay api url');
        if (url) {
            this.service.addPirateBay(url).then(r => this.addResponse(r));
        }
    }

    addKnaben() {
        let url = prompt('Enter new Knaben api url');
        if (url) {
            this.service.addKnaben(url).then(r => this.addResponse(r));
        }
    }

    addResponse(response: ServiceResponse<TorrentSearchEngine>) {
        if (response.data) {
            this.data.push(response.data);
            this.draw();
            this.test(response.data.id);
        }
    }

    deleteEntry(event: Event) {

        if (event.target && event.target instanceof HTMLElement && confirm('Are you sure')) {
            let row = event.target.parentOfClass('row');
            if (row) {
                let id = parseInt(row.id.slice(4));
                row.addClass('deleting');

                this.service.delete(id).then(response => {
                    if (response.data) {
                        row?.removeElement();
                        this.data.splice(this.data.findIndex(m => m.id == id), 1);
                        this.draw();
                    } else {
                        row?.removeClass('deleting');
                    }
                });
            }
        }
    }

    makeActive(event: Event) {

        if (event.target && event.target instanceof HTMLElement) {
            let row = event.target.parentOfClass('row');
            if (row) {
                let id = parseInt(row.id.slice(4));
                element('torrentSearchEngines_table').addClass('saving');

                this.service.activate(id).then(response => {
                    if (response.data) {
                        let oldIndex = null;
                        for (let i = 0; i < this.data.length; i++) {
                            this.data[i].active = this.data[i].id == id;
                            if (this.data[i].id == id) {
                                oldIndex = i;
                            }
                        };
                        if (oldIndex) {
                            this.data.splice(0, 0, this.data.splice(oldIndex, 1)[0]);
                        }
                        this.draw();
                    }

                    element('torrentSearchEngines_table').removeClass('saving');
                });
            }
        }
    }

    // pageResize() {
    //     draw();
    // }    
}