import { element, makeElement } from "./BRLibraries/DOM";
import { BrandIcon, FadeAnimation, Icon, IconStyle, SolidIcon, makeIcon } from "./BRLibraries/Icon";
import { EpisodeObject } from "./EpisodeObject";
import { IconMenu } from "./IconMenu";
import { tsEpisodeModel } from "./Models/extendedModels";
import { EpisodeModel, SiteSection, UserWatchedStatus } from "./Models/~csharpe-models";
import { MediaLifeService } from "./Services/~csharpe-services";

export class EpisodeFileIcon {

    service = new MediaLifeService.HomeController();

    node: HTMLElement;
    watchButtonNode: HTMLElement;
    checkForDownloadTimer: NodeJS.Timeout | null = null;
    iconMenu: IconMenu;

    constructor(public episodeObj: EpisodeObject, public additionalClasses: string | null = null) {

        let episode = episodeObj.episode;

        if (!window.episodeFileIcons) {
            window.episodeFileIcons = {};
        }

        let thisId = `${episode.siteSection}_${episodeObj.show.id}_${episode.id}_FILE`;
        if (window.episodeFileIcons[thisId]) {
            this.node = window.episodeFileIcons[thisId].node;
            this.watchButtonNode = window.episodeFileIcons[thisId].watchButtonNode;
            this.iconMenu = window.episodeFileIcons[thisId].iconMenu;
        }
        else {
            let title = episode.filePath;
            if (episode.durationSeconds) {
                let hours = Math.floor(episode.durationSeconds / 3600);
                let minutes = Math.floor((episode.durationSeconds % 3600) / 60);
                let seconds = Math.floor(episode.durationSeconds % 60);
                let durationLine = `\nDuration: ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                title = (title ? title : '') + durationLine.trim();
            }

            window.episodeFileIcons[thisId] = this;
            this.node = makeElement('div', { class: 'episode-watch-icon episode-file-icon', title: title });
            
            this.watchButtonNode = this.node.appendIcon(new SolidIcon('eye'), { 
                class: 'file-button',
                click: () => {}
            });

            this.iconMenu = new IconMenu(thisId, this.node, this.watchButtonNode, [], '', '');

            this.updateClass();
        }

        if (additionalClasses) {
            this.node.addClass(additionalClasses);
        }

    }

    updateClass() {

        let episode = this.episodeObj.episode;

        this.node.removeClass('orange');
        this.node.removeClass('faded');
        this.node.style.fontSize = '';

        const menuButtons: HTMLElement[] = []
        if (this.episodeObj.episode.siteSection == SiteSection.YouTube) {
            menuButtons.push(makeIcon(new BrandIcon('chromecast'), { label: 'Stream', class: 'stream', click: (e) => { e.stopPropagation(); this.stream() } }))
        }
        
        if (episode.filePath && episode.inCloud) {
            const icon = episode.requestDownload ? 'cloud-arrow-down' : 'cloud'
            this.node.changeIcon(icon);
            this.addClick(() => this.toggleRequestDownload());
            menuButtons.push(makeIcon(icon, { label: episode.requestDownload ? 'Cancel Download Request' : 'Request Download', class: 'primary-btn', click: (e) => { e.stopPropagation(); this.toggleRequestDownload() } }),)
        }
        else if (episode.filePath) {
            this.node.changeIcon(new BrandIcon('youtube'));
            this.addClick(() => this.play());
            menuButtons.push(makeIcon('traffic-cone', { label: 'Play VLC', class: 'primary-btn', click: (e) => { e.stopPropagation(); this.play() } }),)
        }
        else if (episode.hasTorrents) {
            this.node.changeIcon('download');
            this.node.title = episode.torrents.map(t => t.hash).join('\n');
        }
        else if (episode.userWatchedStatus == UserWatchedStatus.Unwatched && !episode.skip) {
            this.node.changeIcon('video-slash');
            this.node.addClass('faded');
            this.addClick(() => this.addTorrent())
            menuButtons.push(makeIcon('magnet', { label: 'Add Torrent', class: 'primary-btn', click: (e) => { e.stopPropagation(); this.addTorrent() } }),)
        }
        else {
            this.node.addClass('hide');
        }
        
        const thisId = `${episode.siteSection}_${this.episodeObj.show.id}_${episode.id}_FILE`
        this.iconMenu = new IconMenu(thisId, this.node, this.watchButtonNode, menuButtons, 'file-menu', 'primary-btn');

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
        this.node.changeIcon(new Icon('ellipsis', { animation: new FadeAnimation() }));
        this.node.style.fontSize = '1.6rem';
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
        this.iconMenu.closeTouchMenu();
        window.vlc.open(this.episodeObj);
    }

    stream() {
        this.iconMenu.closeTouchMenu();
        if (this.episodeObj.episode.siteSection == SiteSection.YouTube) {

            const iconShowId = `${this.episodeObj.show.siteSection}_${this.episodeObj.show.id}_`;
            const episodeId = this.episodeObj.episode.id

            let url = 'https://www.youtube.com/embed/' + episodeId + '?autoplay=1';
            element('youtube_wrapper').html(`<iframe id="youtube_frame" src="${url}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen autoplay></iframe>`)
            element('youtube_wrapper').unhide();
            
            if (window.episodeWatchIcons && window.episodeWatchIcons[iconShowId + episodeId]) {
                window.episodeWatchIcons[iconShowId + episodeId].setPlaying(null);
            }
            
        } else {
            alert('Currently streaming is only supported for YouTube episodes');
        }
    }

    toggleRequestDownload() {
        if (!this.episodeObj.anySaving()) {
            this.setSaving();
            this.episodeObj.toggleRequestDownload(() => this.updateClass());
        }
    }

    setPlaying() {
        for (const [key, value] of Object.entries(window.episodeFileIcons)) {
            value.updateClass();
        }
        this.node.changeIcon(new SolidIcon('traffic-cone'));
        this.node.addClass('orange');
        this.removeClick();
    }

}