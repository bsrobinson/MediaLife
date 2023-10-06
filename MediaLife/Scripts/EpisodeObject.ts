import { tsEpisodeModel, tsShowModel } from "./Models/extendedModels";
import { MediaLifeService } from "./Services/~csharpe-services";

export class EpisodeObject {

    service = new MediaLifeService.HomeController();

    constructor(public show: tsShowModel, public episode: tsEpisodeModel) {
    }

    toggleWatched(callback: () => void) {
        this.episode.watchedSaving = true;
        this.updateEpisode({
            ...this.episode,
            watched: this.episode.watched ? null : new Date().formatForJson()
        }, callback);
    }

    toggleStartedWatching(callback: () => void) {
        this.episode.watchedSaving = true;
        this.updateEpisode({
            ...this.episode,
            startedWatching: this.episode.startedWatching ? null : new Date().formatForJson()
        }, callback);
    }

    toggleSkip(callback: () => void) {
        this.episode.skipSaving = true;
        this.updateEpisode({
            ...this.episode,
            skip: !this.episode.skip
        }, callback);
    }

    toggleRequestDownload(callback: () => void) {
        this.episode.requestDownloadSaving = true;
        this.updateEpisode({
            ...this.episode,
            requestDownload: !this.episode.requestDownload
        }, callback);
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

    updateEpisode(updatedEpisode: tsEpisodeModel, callback: () => void) {
        updatedEpisode.siteSection = this.episode.siteSection;
        delete updatedEpisode.obj;
        this.service.updateEpisode(this.show.siteSection, this.show.id, updatedEpisode).then(response => {
            if (response.data) {
                let ep = response.data.episodes.find(e => e.id == this.episode.id);
                if (ep) {
                    this.episode.watched = ep.watched;
                    this.episode.startedWatching = ep.startedWatching;
                    this.episode.skip = ep.skip;
                    this.episode.requestDownload = ep.requestDownload;
                    
                    this.show.episodePosters = response.data.episodePosters;
                    this.show.nextEpisode = response.data.nextEpisode;
                    this.show.episodeAfterNext = response.data.episodeAfterNext;
                    this.show.unwatchedCount = response.data.unwatchedCount
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