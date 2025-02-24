import { element } from '../../Scripts/BRLibraries/DOM'
import { MediaLifeService, ServiceErrorMessage } from '../../Scripts/Services/~csharpe-services';
import '../../Scripts/BRLibraries/Form';
import { MediaLife } from '../../Scripts/Site';
import { LoggedPayload } from '../../Scripts/Models/~csharpe-models';

export class LogIndex {

    service = new MediaLifeService.UpdateController();

    constructor(private site: MediaLife, private data: LoggedPayload) {
    }

    init() {
        if (this.data.received) {
            let json = JSON.parse(this.data.received);
            element('receivedPageContent').html(JSON.stringify(json, null, 2));
            console.log('Received', json);
        }
        if (this.data.reply) {
            let json = JSON.parse(this.data.reply);
            element('replyPage').html(JSON.stringify(json, null, 2));
            console.log('Reply', json);
        }
    }

    toggleGroup(event: MouseEvent) {
        if (event.target && event.target instanceof HTMLElement) {
            event.target.parentOfClass('row')?.toggleClass('open');
        }
    }

    switchTab(tab: string) {
        element('logTab').toggleClassIfTrue('active', tab == 'log');
        element('logPage').toggleClassIfTrue('hide', tab != 'log');
        element('receivedTab').toggleClassIfTrue('active', tab == 'received');
        element('receivedPage').toggleClassIfTrue('hide', tab != 'received');
        element('replyTab').toggleClassIfTrue('active', tab == 'reply');
        element('replyPage').toggleClassIfTrue('hide', tab != 'reply');
    }

    replayPayload(button: HTMLButtonElement) {
        if (this.data.received) {
            button.disableWithSpinIcon();
            let json = JSON.parse(this.data.received);
            this.service.runUpdate(json.payload, ServiceErrorMessage.None).then(response => {
                button.enable();
                button.disableWithLabel('Check Network Response');
                setTimeout(() => { button.enable() }, 2000);
            });
        } else {
            button.disableWithLabel('error');
        }
    }
    
}