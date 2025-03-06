//**
//** This file was written by Gaspar
//**
//** It contains all models and enums in:
//**     ../../**/*.cs
//**     ../../../MediaLife.Library/**/*.cs
//**     only if attributed: [ExportFor] with GasparType.TypeScript or containing group
//**
//** full configuration in: ../../gaspar.config.json
//**

//File: ../../Models/ClientData.cs

export interface ClientData {
    unwatchedTag: string | null;
    files: ClientFile[];
    torrents: ClientTorrent[];
}

export interface ClientFile {
    fileType: SiteSection;
    path: string | null;
    tags: string[];
    inCloud: boolean;
    show: ShowModel | null;
    episode: EpisodeModel | null;
    valid: boolean;
}

export interface ClientTorrent {
    hash: string;
    percentComplete: number;
    files: string[];
    show: ShowModel | null;
    episode: EpisodeModel | null;
    torrentName: string;
    torrentResultCount: number | null;
    strippedSpecialChars: boolean;
    valid: boolean;
    destinationFolder: string;
    destinationFileName: string;
    videoFile: string | null;
}

export interface ClientActions {
    error: string | null;
    deleteTorrents: ClientTorrent[];
    saveAndDeleteTorrents: ClientTorrent[];
    addTorrents: ClientTorrent[];
    downloads: ClientTorrent[];
    deleteFiles: ClientFile[];
    reTagFiles: ClientFile[];
    downloadFileFromCloud: EpisodeModel[];
}

//File: ../../Models/PageModels.cs

export interface ListPageModel {
    user: User;
    context: ShowModelContext;
    shows: ShowModel[];
}

export interface ShowPageModel {
    user: User;
    siteSection: SiteSection;
    show: ShowModel;
    recommenders: string[];
    someEpisodesInList: boolean;
    showListOptions: boolean;
}

//File: ../../Models/Configuration.cs

export interface IConfiguration {
}

export interface Configuration extends IConfiguration {
    logDays: number;
    userConfig: UserConfig;
}

export interface UserConfig extends IConfiguration {
    clientUpdateEnabled: boolean;
    clientFileThresholdPercent: number;
    tvConfig: TVConfig;
    youTubeConfig: YouTubeConfig;
    movieConfig: MovieConfig;
    bookConfig: BookConfig;
    vlcConfig: VLCConfig;
}

export interface SectionConfig extends IConfiguration {
    updateFromDataProvider: boolean;
    deleteWatched: boolean;
    downloadLimit: number | null;
    downloadSeriesOffset: number | null;
    keepNextEpisodeOffCloud: boolean;
}

export interface TVConfig extends SectionConfig {
}

export interface YouTubeConfig extends SectionConfig {
}

export interface MovieConfig extends SectionConfig {
    theMovieDbApiKey: string | null;
    movieReleaseCountryCode: string | null;
}

export interface BookConfig extends SectionConfig {
}

export interface VLCConfig extends IConfiguration {
    address: string | null;
    password: string | null;
}

//File: ../../Models/VLCStatus.cs

export interface VLCStatus {
    state: string | null;
    time: number;
    length: number;
    position: number;
    fullscreen: boolean;
    information: VLC_Information | null;
    show: ShowModel | null;
}

export interface VLC_Information {
    category: VLC_Category | null;
}

export interface VLC_Category {
    meta: VLC_Meta | null;
}

export interface VLC_Meta {
    filename: string | null;
}

//File: ../../Models/EpisodeModel.cs

export interface EpisodeModel extends BaseSiteObjectModel {
    seriesNumber: number;
    number: number;
    poster: string | null;
    certificate: string | null;
    author: string | null;
    airDate: string | null;
    userWatched: string | null;
    userStartedWatching: string | null;
    skip: boolean;
    userHasWatched: boolean;
    userHasStartedWatching: boolean;
    watchStatus: WatchedStatus;
    userWatchedStatus: UserWatchedStatus;
    filePath: string | null;
    inCloud: boolean;
    requestDownload: boolean;
    torrents: Torrent[];
    users: EpisodeUserModel[];
    me: EpisodeUserModel | null;
    inLists: List[];
    hasTorrents: boolean;
    seriesEpisodeNumber: string;
    mergedFromShow: BaseSiteObjectModel | null;
}

export enum UserWatchedStatus {
    IWatched = 0,
    MyShowEveryoneWatched = 1,
    MyShowIStartedWatching = 2,
    MyShowSomeWatched = 3,
    SomeWatched = 4,
    Unwatched = 5,
}

export enum WatchedStatus {
    EveryoneWatched = 0,
    Unwatched = 1,
}

//File: ../../Models/ShowModel.cs

export interface ShowModel extends BaseSiteObjectModel {
    episodeIndex: number;
    poster: string | null;
    network: TvNetwork | null;
    mergeWithParentShowId: string | null;
    mergeWithParentSiteSection: SiteSection | null;
    episodes: EpisodeModel[];
    isAdded: boolean;
    userAdded: string | null;
    deleteWatched: boolean;
    watchFromNextPlayable: boolean;
    downloadAllTogether: boolean;
    downloadLimit: number | null;
    downloadSeriesOffset: number | null;
    keepAllDownloaded: boolean;
    showEpisodesAsThumbnails: boolean;
    recommendedBy: string | null;
    hideWatched: boolean;
    hideUnplayable: boolean;
    searchScore: number;
    isList: boolean;
    sortableName: string;
    posterName: string;
    showAuthor: string | null;
    episodePosters: string[];
    episodeIds: EpisodeId[];
    userUnwatched: EpisodeModel[];
    unwatched: EpisodeModel[];
    nextEpisode: EpisodeModel | null;
    episodeAfterNext: EpisodeModel | null;
    episodeCount: number;
    userUnwatchedCount: number;
    watchedCount: number;
    nextEpisodePlayableSort: number;
    firstAirDate: string | null;
    lastAirDate: string | null;
    startedAiring: boolean;
    started: boolean;
    userComplete: boolean;
    unSkipped: EpisodeModel[];
    skipUntilSeries: number | null;
    lastWatched: string | null;
    latestEpisode: string | null;
    watchedRecently: boolean;
    users: ShowUserModel[];
    activeUserNames: string;
}

export interface ShowSettings {
    hideWatched: boolean;
    hideUnplayable: boolean;
    recommendedBy: string | null;
    downloadLimit: number | null;
    downloadSeriesOffset: number | null;
    deleteWatched: boolean;
    watchFromNextPlayable: boolean;
    downloadAllTogether: boolean;
    keepAllDownloaded: boolean;
    showEpisodesAsThumbnails: boolean;
    skipUntilSeries: number;
    users: ShowUserModel[];
}

//File: ../../Models/BaseSiteObjectModel.cs

export interface BaseSiteObjectModel {
    id: string;
    siteSection: SiteSection;
    name: string;
}

//File: ../../Models/ShowUserModel.cs

export interface ShowUserModel {
    id: number;
    name: string;
    me: boolean;
    hasAdded: boolean;
}

export interface EpisodeUserModel extends ShowUserModel {
    watched: string | null;
}

//File: ../../Models/EpisodeId.cs

export interface EpisodeId {
    id: string;
    section: SiteSection;
}

//File: ../../../MediaLife.Library/Models/SiteSection.cs

export interface ShowModelContext {
    pageType: PageType;
}

export enum SiteSection {
    Lists = 'lists',
    TV = 'tv',
    YouTube = 'youtube',
    Movies = 'movies',
    Books = 'books',
}

export enum PageType {
    Shows = 'shows',
    Search = 'search',
}

//File: ../../../MediaLife.Library/DAL/Torrent.cs

export interface Torrent {
    id: number;
    episodeId: string;
    siteSection: SiteSection;
    hash: string;
    name: string;
    added: string;
    lastPercentage: number;
    manuallyAdded: boolean;
}

//File: ../../../MediaLife.Library/DAL/UserShow.cs

export interface UserShow {
    userId: number;
    showId: string;
    siteSection: SiteSection;
    added: string;
    recommendedBy: string | null;
    watchFromNextPlayable: boolean;
    showEpisodesAsThumbnails: boolean;
    hideWatched: boolean;
    hideUnplayable: boolean;
}

//File: ../../../MediaLife.Library/DAL/TvNetwork.cs

export interface TvNetwork {
    networkId: number;
    name: string | null;
    countryCode: string | null;
    homepageUrl: string | null;
    searchUrl: string | null;
}

//File: ../../../MediaLife.Library/DAL/UserEpisode.cs

export interface UserEpisode {
    userId: number;
    episodeId: string;
    siteSection: SiteSection;
    watched: string | null;
    startedWatching: string | null;
}

//File: ../../../MediaLife.Library/DAL/PirateBay.cs

export interface PirateBay {
    id: number;
    url: string;
    active: boolean;
    consecutiveErrors: number;
    lastError: string | null;
    lastSuccess: string | null;
    resultsInLastRun: number;
}

//File: ../../../MediaLife.Library/DAL/Show.cs

export interface Show {
    showId: string;
    siteSection: SiteSection;
    name: string;
    poster: string | null;
    networkId: number | null;
    updated: string;
    mergeWithParentShowId: string | null;
    mergeWithParentSiteSection: SiteSection | null;
    deleteWatched: boolean;
    downloadAllTogether: boolean;
    downloadSeriesOffset: number | null;
    downloadLimit: number | null;
    keepAllDownloaded: boolean;
}

//File: ../../../MediaLife.Library/DAL/User.cs

export interface User {
    userId: number;
    accountId: number;
    name: string;
    password: string;
    role: UserRole;
    simpleMode: boolean;
}

export enum UserRole {
    User = 'User',
    AccountAdmin = 'Account Admin',
    SiteAdmin = 'Site Admin',
}

//File: ../../../MediaLife.Library/DAL/List.cs

export interface List {
    listId: number;
    name: string;
    created: string;
}

//File: ../../../MediaLife.Library/DAL/ListEntry.cs

export interface ListEntry {
    listId: number;
    episodeId: string;
    siteSection: SiteSection;
    rank: number;
}

//File: ../../../MediaLife.Library/DAL/LoggedPayload.cs

export interface LoggedPayload {
    id: number;
    received: string | null;
    reply: string | null;
}

//File: ../../../MediaLife.Library/DAL/UserAccount.cs

export interface UserAccount {
    accountId: number;
    name: string;
}
