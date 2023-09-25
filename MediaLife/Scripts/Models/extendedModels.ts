import { EpisodeObject } from "../EpisodeObject";
import { EpisodeId, EpisodeModel, ListPageModel, ShowModel } from "./~csharpe-models";

export interface tsShowModel extends ShowModel {
    skellington: boolean,
    [key: string]: string | any, //for sort function
}

export interface tsShowModelForList extends ShowModel {
    hasChanges: boolean;
}

export interface tsEpisodeModel extends EpisodeModel {
    obj?: EpisodeObject,
    watchedSaving: boolean,
    skipSaving: boolean,
    requestDownloadSaving: boolean,
}

export interface tsListPageModel extends ListPageModel {
    shows: tsShowModel[],
}

export interface tsEpisodeId extends EpisodeId {
    showId: number,
}