import { makeElement } from "./BRLibraries/DOM";
import { EpisodeFileIcon } from "./EpisodeFileIcon";
import { EpisodeObject } from "./EpisodeObject";
import { IconMenu } from "./IconMenu";
import { SiteSection } from "./Models/~csharpe-models";
import { MedialifeService } from "./Services/~csharpe-services";

export class EpisodeWatchIcon {

    service = new MedialifeService.HomeController();

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
            this.node = makeElement('div', { });
            // this.node.obj = this;

            this.watchButtonNode = this.node.appendElement('div', {
                class: 'watched-button', events: {
                    click: () => this.iconClick(),
                }
            });

            this.iconMenu = new IconMenu(
                thisId,
                this.node,
                this.watchButtonNode,
                [
                    { title: 'Skip', class: 'skip', events: { click: () => this.toggleSkip() } },
                    { title: 'Started', class: 'started', events: { click: () => this.toggleStarted() } },
                    { title: this.watchedString, class: 'watched', events: { click: () => this.toggleWatched() } },
                ]
            );
            this.updateClass();
        }

    }

    updateClass() {

        let episode = this.episodeObj.episode;
        this.node.className = 'episode-watch-icon ' + this.additionalClasses;

        if (episode.watched) {
            this.node.addClass('watched');
        }
        else if (episode.startedWatching) {
            this.node.addClass('started-watching');
        }
        else if (episode.skip) {
            this.node.addClass('skip');
        }

        this.watchButtonNode.title = '';
        if (episode.startedWatching) {
            this.watchButtonNode.title = 'Started ' + this.watchingString + ': ' + new Date(episode.startedWatching).format('j M Y');
            if (episode.watched) { this.watchButtonNode.title += '\n'; }
        }
        if (episode.watched) {
            this.watchButtonNode.title += this.watchedString + ': ' + new Date(episode.watched).format('j M Y');
        }
        if (!episode.watched && !episode.startedWatching) {
            if (episode.skip) {
                this.watchButtonNode.title = 'Remove skip';
            } else {
                this.watchButtonNode.title = 'Mark as ' + this.watchedString.toLowerCase();
            }
        }
    }

    iconClick() {
        if (this.episodeObj.episode.skip) {
            this.toggleSkip();
        } else {
            this.toggleWatched();
        }
    }

    toggleWatched() {
        this.iconMenu.closeTouchMenu();
        if (!this.episodeObj.anySaving()) {
            this.node.addClass('saving');
            this.episodeObj.toggleWatched(() => this.updateClass());
        }
    }

    toggleStarted() {
        this.iconMenu.closeTouchMenu();
        if (!this.episodeObj.anySaving()) {
            this.node.addClass('saving');
            this.episodeObj.toggleStartedWatching(() => this.updateClass());
        }
    }

    toggleSkip() {
        this.iconMenu.closeTouchMenu();
        if (!this.episodeObj.anySaving()) {
            this.node.addClass('saving');
            this.episodeObj.toggleSkip(() => this.updateClass());
        }
    }

    setPlaying(nextFileIcon: EpisodeFileIcon | null) {
        if (!this.episodeObj.anySaving() && !this.episodeObj.episode.startedWatching) {

            this.node.addClass('saving');
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
            if (value.episodeObj.show.id == this.episodeObj.show.id && value.episodeObj.episode.id != this.episodeObj.episode.id && value.episodeObj.episode.startedWatching && !value.episodeObj.episode.watched) {
                otherStarted.push(value);
            }
        }
        if (otherStarted.length > 0 && confirm('Mark other started episodes of ' + this.episodeObj.show.name + ' as watched?')) {
            for (var i = 0; i < otherStarted.length; i++) {
                otherStarted[i].toggleWatched();
            }
        }
    }
}