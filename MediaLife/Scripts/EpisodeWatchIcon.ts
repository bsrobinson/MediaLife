import { makeElement } from "./BRLibraries/DOM";
import { EpisodeFileIcon } from "./EpisodeFileIcon";
import { EpisodeObject } from "./EpisodeObject";
import { IconMenu } from "./IconMenu";
import { SiteSection, UserWatchedStatus } from "./Models/~csharpe-models";
import { MediaLifeService } from "./Services/~csharpe-services";
import './BRLibraries/Icon';
import { FadeAnimation, Icon, IconStyle, SolidIcon, makeIcon } from "./BRLibraries/Icon";

export class EpisodeWatchIcon {

    service = new MediaLifeService.HomeController();

    node: HTMLElement;
    watchButtonNode: HTMLElement;
    iconMenu: IconMenu;

    watchedString: string;
    watchingString: string;

    constructor(public episodeObj: EpisodeObject, public additionalClasses: string | null = null) {

        this.watchedString = episodeObj.show.siteSection == SiteSection.Books ? 'Read' : 'Watched';
        this.watchingString = episodeObj.show.siteSection == SiteSection.Books ? 'Reading' : 'Watching';

        let episode = episodeObj.episode;

        if (!window.episodeWatchIcons) {
            window.episodeWatchIcons = {};
        }

        let thisId = `${episode.siteSection}_${episodeObj.show.id}_${episode.id}`;
        if (window.episodeWatchIcons[thisId]) {
            this.node = window.episodeWatchIcons[thisId].node;
            this.watchButtonNode = window.episodeWatchIcons[thisId].watchButtonNode;
            this.iconMenu = window.episodeWatchIcons[thisId].iconMenu;
        }
        else {

            window.episodeWatchIcons[thisId] = this;
            this.node = makeElement('div', { class: 'episode-watch-icon' });
            // this.node.obj = this;

            this.watchButtonNode = this.node.appendIcon(new SolidIcon('eye'), { 
                class: 'watched-button',
                click: () => this.iconClick() 
            });

            let multiUser = episode.users.filter(u => u.hasAdded).length > 1
            let buttons = [
                makeIcon('ban', { label: 'Skip', class: 'skip', click: () => this.toggleSkip() }),
                makeIcon('stopwatch', { label: 'Started', class: 'started', click: () => this.toggleStarted() }),
                makeIcon('eye', { label: multiUser ? 'Alone' : this.watchedString, class: 'watched-alone', click: () => this.toggleWatchedAlone() }),
            ]
            if (multiUser) {
                buttons.push(makeIcon('eye', { label: 'Together', class: 'watched-together', click: () => this.toggleWatchedTogether() }))
            }

            this.iconMenu = new IconMenu(thisId, this.node, this.watchButtonNode, buttons);
            this.updateClass();
        }

        if (additionalClasses) {
            this.node.addClass(additionalClasses);
        }

    }

    updateClass() {

        let episode = this.episodeObj.episode;

        this.node.removeClass('saving')
        this.watchButtonNode.changeIcon(new SolidIcon('eye'));
        
        Object.values(UserWatchedStatus).forEach(s => {
            if (typeof s == 'string') {
                this.node.removeClass(`watch_status_${s}`)
            }
        })
        this.node.addClass(`watch_status_${UserWatchedStatus[episode.userWatchedStatus]}`)
        this.node.toggleClassIfTrue('skip', episode.skip);

        if (episode.skip) {
            this.watchButtonNode.changeIcon(new SolidIcon('ban'));
        }

        let titleLines: string[] = []
        if (episode.userStartedWatching) {
            titleLines.push(`Started ${this.watchingString}: ${new Date(episode.userStartedWatching).format('j M Y')}`)
        }
        if (episode.userWatched) {
            titleLines.push(`${this.watchedString}: ${new Date(episode.userWatched).format('j M Y')}`);
        }
        episode.users.forEach(u => {
            if (!u.me && u.watched) {
                titleLines.push(`${u.name} ${this.watchedString}: ${new Date(u.watched).format('j M Y')}`)
            }
        })
        this.watchButtonNode.title = titleLines.join('\n')
    }

    iconClick() {
        if (this.episodeObj.episode.skip) {
            this.toggleSkip();
        } else {
            this.toggleWatchedTogether();
        }
    }

    toggleWatchedAlone() {
        this.iconMenu.closeTouchMenu();
        if (!this.episodeObj.anySaving()) {
            this.node.addClass('saving');
            this.watchButtonNode.changeIcon(new Icon('ellipsis', { animation: new FadeAnimation() }))
            this.episodeObj.toggleWatchedAlone(() => this.updateClass());
        }
    }

    toggleWatchedTogether() {
        this.iconMenu.closeTouchMenu();
        if (!this.episodeObj.anySaving()) {
            this.node.addClass('saving');
            this.watchButtonNode.changeIcon(new Icon('ellipsis', { animation: new FadeAnimation() }))
            this.episodeObj.toggleWatchedTogether(() => this.updateClass());
        }
    }

    toggleStarted() {
        this.iconMenu.closeTouchMenu();
        if (!this.episodeObj.anySaving()) {
            this.node.addClass('saving');
            this.watchButtonNode.changeIcon(new Icon('ellipsis', { animation: new FadeAnimation() }))
            this.episodeObj.toggleStartedWatching(() => this.updateClass());
        }
    }

    toggleSkip() {
        this.iconMenu.closeTouchMenu();
        if (!this.episodeObj.anySaving()) {
            this.node.addClass('saving');
            this.watchButtonNode.changeIcon(new Icon('ellipsis', { animation: new FadeAnimation() }))
            this.episodeObj.toggleSkip(() => this.updateClass());
        }
    }

    setPlaying(nextFileIcon: EpisodeFileIcon | null) {
        if (!this.episodeObj.anySaving() && !this.episodeObj.episode.userHasStartedWatching) {

            this.node.addClass('saving');
            this.watchButtonNode.changeIcon(new Icon('ellipsis', { animation: new FadeAnimation() }))
            this.episodeObj.toggleStartedWatching(() => this.playingSetAsStarted());

            if (nextFileIcon && nextFileIcon.episodeObj.episode.inCloud && !nextFileIcon.episodeObj.episode.requestDownload) {
                nextFileIcon.toggleRequestDownload();
            }    
        }
    }

    playingSetAsStarted() {

        this.updateClass();

        var otherStarted = [];
        for (const [key, value] of Object.entries(window.episodeWatchIcons)) {
            if (value.episodeObj.show.id == this.episodeObj.show.id && value.episodeObj.episode.id != this.episodeObj.episode.id && value.episodeObj.episode.userStartedWatching && !value.episodeObj.episode.userWatched) {
                otherStarted.push(value);
            }
        }
        if (otherStarted.length > 0 && confirm('Mark other started episodes of ' + this.episodeObj.show.name + ' as watched?')) {
            for (var i = 0; i < otherStarted.length; i++) {
                otherStarted[i].toggleWatchedTogether();
            }
        }
    }
}