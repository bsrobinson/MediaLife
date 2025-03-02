import { tsEpisodeModel, tsShowModel } from "./Models/extendedModels";
import { MediaLifeService } from "./Services/~csharpe-services";
import { EpisodeUserModel, UserWatchedStatus } from "./Models/~csharpe-models";

export class EpisodeObject {

    service = new MediaLifeService.HomeController();

    constructor(public show: tsShowModel, public episode: tsEpisodeModel) {
    }

    toggleWatchedAlone(callback: () => void) {
        this.fixEpisodeUsers()
        let me = this.episode.users.find(u => u.me)
        if (me) {
            this.episode.watchedSaving = true;
            this.updateEpisode({
                ...this.episode,
                me: null,
                users: this.episode.users.map(u => ({
                    ...u,
                    watched: this.episode.userWatchedStatus == UserWatchedStatus.IWatched ? null : (u.me ? new Date().formatForJson() : null)
                }))
            }, this.episode.userWatchedStatus == UserWatchedStatus.MyShowEveryoneWatched, callback);
        }
    }

    toggleWatchedTogether(callback: () => void) {
        this.fixEpisodeUsers()
        this.episode.watchedSaving = true;
        this.updateEpisode({
            ...this.episode,
            me: null,
            users: this.episode.users.map(u => ({
                ...u,
                watched: this.episode.userWatchedStatus == UserWatchedStatus.MyShowEveryoneWatched ? null : new Date().formatForJson()
            }))
        }, true, callback);
    }

    fixEpisodeUsers() {
        if (this.episode.users.length == 0 || (this.episode.users.length == 1 && this.episode.users[0].id == 0)) {
            this.episode.users = this.show.users as EpisodeUserModel[]
        }
    }

    toggleStartedWatching(callback: () => void) {
        this.episode.watchedSaving = true;
        this.updateEpisode({
            ...this.episode,
            userStartedWatching: this.episode.userHasStartedWatching ? null : new Date().formatForJson()
        }, false, callback);
    }

    toggleSkip(callback: () => void) {
        this.episode.skipSaving = true;
        this.updateEpisode({
            ...this.episode,
            skip: !this.episode.skip
        }, false, callback);
    }

    toggleRequestDownload(callback: () => void) {
        this.episode.requestDownloadSaving = true;
        this.updateEpisode({
            ...this.episode,
            requestDownload: !this.episode.requestDownload
        }, false, callback);
    }

    anySaving() {
        return this.episode.watchedSaving || this.episode.skipSaving || this.episode.requestDownloadSaving;
    }
    savingDone() {
        this.episode.watchedSaving = this.episode.skipSaving = this.episode.requestDownloadSaving = false;
    }

    updateFromDb(callback: () => void) {
        this.service.episode(this.show.siteSection, this.episode.id).then(response => {
            if (response.data) {
                this.episode.filePath = response.data.filePath;
                this.episode.requestDownload = response.data.requestDownload;
                this.episode.inCloud = response.data.inCloud;
            }
            callback();
        });
    }

    updateEpisode(updatedEpisode: tsEpisodeModel, updateAllUsers: boolean, callback: () => void) {
        updatedEpisode.siteSection = this.episode.siteSection;
        delete updatedEpisode.obj;
        this.service.updateEpisode(this.show.siteSection, updateAllUsers, this.show.id, updatedEpisode).then(response => {
            if (response.data) {
                let ep = response.data.episodes.find(e => e.id == this.episode.id);
                if (ep) {
                    this.episode.userWatched = ep.userWatched;
                    this.episode.userHasWatched = ep.userHasWatched;
                    this.episode.userStartedWatching = ep.userStartedWatching;
                    this.episode.userHasStartedWatching = ep.userHasStartedWatching;
                    this.episode.watchStatus = ep.watchStatus;
                    this.episode.userWatchedStatus = ep.userWatchedStatus;
                    this.episode.skip = ep.skip;
                    this.episode.requestDownload = ep.requestDownload;
                    this.episode.me = ep.me;
                    this.episode.users = ep.users
                    
                    this.show.episodePosters = response.data.episodePosters;
                    this.show.nextEpisode = response.data.nextEpisode;
                    this.show.episodeAfterNext = response.data.episodeAfterNext;
                    this.show.userUnwatchedCount = response.data.userUnwatchedCount
                }
            }
            this.savingDone();

            if (window.page.episodeUpdated) {
                window.page.episodeUpdated(this);
            }
            callback();
        });
    }
}