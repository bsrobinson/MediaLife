import { makeElement } from "./BRLibraries/DOM";
import { EpisodeObject } from "./EpisodeObject";
import { tsEpisodeModel } from "./Models/extendedModels";
import { EpisodeModel } from "./Models/~csharpe-models";
import { MediaLifeService } from "./Services/~csharpe-services";

export class EpisodeFileIcon {

    service = new MediaLifeService.HomeController();

    node: HTMLElement;
    checkForDownloadTimer: NodeJS.Timeout | null = null;

    constructor(public episodeObj: EpisodeObject, public additionalClasses: string | null = null) {

        let episode = episodeObj.episode;

        if (!window.episodeFileIcons) {
            window.episodeFileIcons = {};
        }

        let thisId = `${episode.siteSection}_${episodeObj.show.id}_${episode.id}`;
        if (window.episodeFileIcons[thisId]) {
            this.node = window.episodeFileIcons[thisId].node;
        }
        else {
            window.episodeFileIcons[thisId] = this;
            this.node = makeElement('div', { title: episode.filePath });
            
            this.updateClass();
        }

    }

    updateClass() {

        let episode = this.episodeObj.episode;
        this.node.className = 'episode-file-icon ' + this.additionalClasses;

        if (episode.hasTorrests) {
            this.node.addClass('downloading');
            this.node.title = episode.torrents.map(t => t.hash).join('\n');
        }
        else if (episode.filePath && episode.inCloud) {
            this.node.addClass('in-cloud');
            if (episode.requestDownload) {
                this.node.addClass('request-download');
            }
            this.addClick(() => this.toggleRequestDownload());
        }
        else if (episode.filePath) {
            this.node.addClass('playable');
            this.addClick(() => this.play());
        }
        else if (episode.watched == null && !episode.skip) {
            this.node.addClass('no-file');
            this.addClick(() => this.addTorrent())
        }
        else {
            this.node.addClass('hide');
        }

        if (episode.requestDownload && episode.inCloud && !this.checkForDownloadTimer) {
            this.checkForDownloadTimer = setTimeout(() => this.checkForDownloadComplete(), 60000);
        }
    }

    checkForDownloadComplete() {
        this.checkForDownloadTimer = null;
        this.episodeObj.updateFromDb(() => this.updateClass());
    }

    addClick(action: () => void) {
        this.node.onclick = action;
        this.node.addClass('clickable');
    }

    removeClick() {
        this.node.onclick = null;
        this.node.removeClass('clickable');
    }

    setSaving() {
        this.removeClick();
        this.node.addClass('saving');
    }

    addTorrent() {

        let torrent = prompt('Paste torrent hash or magnet link');
        if (torrent) {
            let btihPos = torrent.indexOf('btih');
            if (btihPos > 0) {
                let hashStart = torrent.slice(btihPos + 4, btihPos + 5) == '%' ? btihPos + 7 : btihPos + 5;
                torrent = torrent.slice(hashStart, hashStart + 40)
            }

            let episode = {
                id: this.episodeObj.episode.id,
                siteSection: this.episodeObj.episode.siteSection,
                name: this.episodeObj.show.name + ' ' + this.episodeObj.episode.seriesEpisodeNumber
            } as EpisodeModel;

            if (torrent.match(/[0-9A-Za-z]{40}/)) {
                this.setSaving();
                this.service.addTorrentHash(episode, torrent).then(response => {
                    if (response.data) {
                        this.episodeObj.episode = response.data as tsEpisodeModel;
                    }
                    this.updateClass();
                });
            } else {
                alert(`'${torrent}' is not a valid torrent hash`);
            }
        }
    }

    play() {
        window.vlc.open(this.episodeObj);
    }

    toggleRequestDownload() {
        if (!this.episodeObj.anySaving()) {
            this.node.addClass('saving');
            this.removeClick();
            this.episodeObj.toggleRequestDownload(() => this.updateClass());
        }
    }

    setPlaying() {
        for (const [key, value] of Object.entries(window.episodeFileIcons)) {
            value.updateClass();
        }
        this.node.addClass('playing')
        this.removeClick();
    }

}