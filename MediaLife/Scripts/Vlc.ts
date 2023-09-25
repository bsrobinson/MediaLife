import { $ } from "./BRLibraries/DOM";
import { EpisodeObject } from "./EpisodeObject";
import { tsEpisodeModel, tsShowModel } from "./Models/extendedModels";
import { VLCStatus } from "./Models/~csharpe-models";
import { MedialifeService, ServiceErrorMessage, ServiceResponse } from "./Services/~csharpe-services";

export class VLCClient {

    service = new MedialifeService.VLCController();

    initialising: boolean = false;
    queuedOpen: EpisodeObject | null = null;
    status: VLCStatus | null = null;

    tickInterval: NodeJS.Timeout | null = null;
    serverRefreshInterval: NodeJS.Timeout | null = null;

    loadTime = new Date();
    timeAtLoad = 0;

    constructor() {
        this.callServer();
        this.initialising = true
    }

    open(episodeObj: EpisodeObject) {

        this.queuedOpen = null;
        if (this.initialising) {
            this.queuedOpen = episodeObj;
        } else {
            let name = `<b>${episodeObj.episode.name}</b>`;
            if (episodeObj.show.siteSection == 'tv') {
                name = `${episodeObj.show.name} - ${episodeObj.episode.seriesEpisodeNumber}<br/>${name}`;
            }
            this.clearIntervals();
            this.showInfo('Preparing to play<br/>' + name, episodeObj.episode.poster || episodeObj.show.poster, `/${episodeObj.show.siteSection}/${episodeObj.show.id}`);


            let iconId = `${episodeObj.show.siteSection}_${episodeObj.show.id}_${episodeObj.episode.id}`;
            if (window.episodeFileIcons[iconId]) {
                window.episodeFileIcons[iconId].setPlaying();
            }

        }
        this.callServer(this.service.open(episodeObj.episode.filePath?.replace(/&/g, '%26') || ''));
    }

    play() {
        if (this.status && this.status.state == 'stopped' && this.status.show && this.status.show.episodeIndex) {
            this.callServer(this.service.open(this.status.show.episodes[this.status.show.episodeIndex].filePath || ''));
        } else {
            this.callServer(this.service.play());
        }
    }

    pause() {
        this.callServer(this.service.pause())
    }

    skip() {
        this.callServer(this.service.skip());
    }

    skipBack() {
        this.callServer(this.service.skipBack());
    }

    seekTo(percent: number) {
        this.callServer(this.service.seekTo(percent))
    }

    previous() {
        if (this.status && this.status.time < 2 && this.status.show && (this.status.show.episodeIndex || -1) > 0) {
            if (this.status.show.watchFromNextPlayable) {
                let files = this.status.show.episodes.filter(e => e.filePath);
                let fileIndex = files.findIndex(f => f.id == this.status?.show?.episodes[this.status.show.episodeIndex || -1].id);
                if (fileIndex > 0) {
                    this.open(new EpisodeObject(this.status.show as tsShowModel, files[fileIndex - 1] as tsEpisodeModel));
                    return;
                }
            } else {
                this.open(new EpisodeObject(this.status.show as tsShowModel, this.status.show.episodes[(this.status.show.episodeIndex || -1) - 1] as tsEpisodeModel));
                return;
            }
        }
        this.seekTo(0);
    }
    next() {
        if (this.status?.show?.episodeIndex && this.status.show.episodeIndex < this.status.show.episodes.length - 1) {
            if (this.status.show.watchFromNextPlayable) {
                let files = this.status.show.episodes.filter(e => e.filePath);
                let fileIndex = files.findIndex(f => f.id == this.status?.show?.episodes[this.status.show.episodeIndex || -1].id);
                if (fileIndex >= 0 && fileIndex < files.length - 1) {
                    this.open(new EpisodeObject(this.status.show as tsShowModel, files[fileIndex + 1] as tsEpisodeModel));
                    return;
                }
            } else {
                this.open(new EpisodeObject(this.status.show as tsShowModel, this.status.show.episodes[this.status.show.episodeIndex + 1] as tsEpisodeModel));
                return;
            }
        }
    }

    fullscreen() {
        this.callServer(this.service.fullscreen());
    }

    scrubberClick(event: MouseEvent) {
        if (event.target instanceof HTMLElement) {
            let percent = (event.offsetX / event.target.offsetWidth) * 100;
            this.seekTo(Math.floor(percent));
        }
    }

    callServer(func: Promise<ServiceResponse<VLCStatus | null>> | null = null) {
        if (this.initialising) {
            this.updateStatus();
        } else {
            if (this.status || func == null) {
                (func || this.service.status(ServiceErrorMessage.None)).then(response => {
                    if (response.data) {
                        this.status = response.data;
                        this.timeAtLoad = response.data.time;
                        this.loadTime = new Date();

                        this.clearIntervals;
                        this.clearIntervals();

                        this.tickInterval = setInterval(() => this.tickTime(), 1000);
                        this.serverRefreshInterval = setInterval(() => this.callServer(), 30000);
                    }

                    this.initialising = false;

                    if (this.queuedOpen) {
                        this.open(this.queuedOpen);
                    }
                    else {
                        this.updateStatus;
                        this.updateStatus();
                    }
                })
            }
            if (!this.status && func != null) {
                this.showError();
            }
        }
    }

    clearIntervals() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
        if (this.serverRefreshInterval) {
            clearInterval(this.serverRefreshInterval)
        }
    }

    updateStatus() {

        if (this.initialising) {

            this.showInfo('Connecting to VLC Server');

        } else {

            if (this.status && (this.status.state != 'stopped' || this.status.show)) {

                $('content').addClass('vlc-open');
                $('vlc_player').removeClass('hide');
                $('vlc_player').removeClass('info-only');
                $('vlc_player').toggleClassIfTrue('playing', this.status.state == 'playing');
                $('vlc_player').toggleClassIfTrue('fullscreen', this.status.fullscreen);

                let filename = this.status.information?.category?.meta?.filename;
                if (filename) {
                    let extensionPos = filename.lastIndexOf('.');
                    $('vlc_playing_title').innerHTML = filename.slice(0, extensionPos > 0 ? extensionPos : undefined);
                    $('vlc-scrubber-time').innerHTML = this.convertSeconds(this.status.time) + '&nbsp;';
                    $('vlc-scrubber-time-remaining').innerHTML = '&nbsp;' + this.convertSeconds(this.status.length);

                    $('vlc-scrubber-mark').style.left = 'calc(' + (this.status.position * 100) + '% - 7px)';

                    $('vlc_player').toggleClassIfTrue('with-poster', this.status.show != null);
                    if (this.status.show) {
                        $<HTMLAnchorElement>('vlc_poster').style.backgroundImage = "url('" + (this.status.show.episodes[this.status.show.episodeIndex || -1].poster || this.status.show.poster) + "')";
                        $<HTMLAnchorElement>('vlc_poster').href = `/${this.status.show.siteSection}/${this.status.show.id}`;

                        let lastEpisode = this.status.show.episodeIndex == this.status.show.episodes.length - 1;
                        let episodeId = this.status.show.episodes[this.status.show.episodeIndex || -1].id;
                        let iconShowId = `${this.status.show.siteSection}_${this.status.show.id}_`;

                        let nextFileIcon = null;
                        if (window.episodeFileIcons && !lastEpisode) {
                            nextFileIcon = window.episodeFileIcons[iconShowId + this.status.show.episodes[(this.status.show.episodeIndex || -2) + 1].id];
                            if (!nextFileIcon && this.status.show.watchFromNextPlayable) {
                                for (let i = (this.status.show.episodeIndex || -3) + 2; i < this.status.show.episodes.length; i++) {
                                    nextFileIcon = window.episodeFileIcons[iconShowId + this.status.show.episodes[i].id];
                                    if (nextFileIcon && nextFileIcon.episodeObj.episode.filePath) { break; }
                                }
                                if (!nextFileIcon) { lastEpisode = true; }
                            }
                        }

                        if (window.episodeFileIcons && window.episodeFileIcons[iconShowId + episodeId]) {
                            window.episodeFileIcons[iconShowId + episodeId].setPlaying();
                        }
                        if (window.episodeWatchIcons && window.episodeWatchIcons[iconShowId + episodeId]) {
                            window.episodeWatchIcons[iconShowId + episodeId].setPlaying(nextFileIcon);
                        }

                        $('vlc_next_episode_button').toggleClassIfTrue('disabled', lastEpisode);
                    }
                }

            } else {

                $('vlc_player').addClass('hide');
                $('content').removeClass('vlc-open');

                if (window.episodeFileIcons) {
                    for (const [key, value] of Object.entries(window.episodeFileIcons)) {
                        value.updateClass();
                    }
                }

            }
        }
    }

    showInfo(message: string, posterImageUrl: string | null = null, posterUrl: string | null = null) {

        $('content').addClass('vlc-open');
        $('vlc_player').removeClass('hide');
        $('vlc_player').addClass('info-only');
        $('vlc_playing_title').innerHTML = message;

        $('vlc_player').toggleClassIfTrue('with-poster', posterImageUrl != null);
        if (posterImageUrl && posterUrl) {
            $<HTMLAnchorElement>('vlc_poster').style.backgroundImage = "url('" + posterImageUrl + "')";
            $<HTMLAnchorElement>('vlc_poster').href = posterUrl;
        }
    }

    showError() {
        $('vlc_player').removeClass('hide');
        this.showInfo('Cannot connect to VLC.  Is it running and configured?');
        setTimeout(() => this.updateStatus(), 3000)
    }

    tickTime() {
        if (this.status?.state == 'playing') {
            let secondsSinceLoad = (new Date().valueOf() - this.loadTime.valueOf()) / 1000;
            this.status.time = this.timeAtLoad + secondsSinceLoad;
            if (this.status.time > this.status.length) {
                this.status.state = 'stopped';
            }
            this.updateStatus();
        }
    }

    convertSeconds(seconds: number) {
        
        let date = new Date(0);
        date.setSeconds(seconds);

        let h = date.getUTCHours();
        let m = date.getUTCMinutes();
        let s = date.getUTCSeconds();

        let mStr = m.toString();
        let sStr = s.toString();

        if (m < 10) { mStr = '0' + mStr; }
        if (s < 10) { sStr = '0' + sStr; }

        let returnString = '';
        if (h > 0) { returnString = h + ':'; }
        returnString += mStr + ':' + sStr;

        return returnString;
    }

}