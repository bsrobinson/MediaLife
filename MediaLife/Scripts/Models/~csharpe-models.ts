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

//File: ../../Models/PageModels.cs

export interface ListPageModel {
    context: ShowModelContext;
    shows: ShowModel[];
}

export interface ShowPageModel {
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
    movieConfig: MovieConfig;
    bookConfig: BookConfig;
    vlcConfig: VLCConfig;
}

export interface SectionConfig extends IConfiguration {
    updateFromDataProvider: boolean;
    deleteWatched: boolean;
    downloadLimit: number | null;
    keepNextEpisodeOffCloud: boolean;
}

export interface TVConfig extends SectionConfig {
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

export interface EpisodeModel {
    id: number;
    siteSection: SiteSection;
    seriesNumber: number;
    number: number;
    name: string;
    poster: string | null;
    certificate: string | null;
    author: string | null;
    airDate: string | null;
    watched: string | null;
    startedWatching: string | null;
    skip: boolean;
    filePath: string | null;
    requestDownload: boolean;
    torrents: Torrent[];
    inLists: List[];
    hasTorrests: boolean;
    seriesEpisodeNumber: string;
    inCloud: boolean | null;
}

//File: ../../Models/ShowModel.cs

export interface ShowModel {
    episodeIndex: number;
    id: number;
    siteSection: SiteSection;
    name: string;
    poster: string | null;
    network: TvNetwork | null;
    episodes: EpisodeModel[];
    added: string | null;
    deleteWatched: boolean;
    watchFromNextPlayable: boolean;
    downloadAllTogether: boolean;
    downloadLimit: number | null;
    recommendedBy: string | null;
    searchScore: number;
    isList: boolean;
    sortableName: string;
    posterName: string;
    showAuthor: string | null;
    episodePosters: string[];
    episodeIds: EpisodeId[];
    unwatched: EpisodeModel[];
    nextEpisode: EpisodeModel | null;
    episodeAfterNext: EpisodeModel | null;
    episodeCount: number;
    unwatchedCount: number;
    watchedCount: number;
    nextEpisodePlayableSort: number;
    firstAirDate: string | null;
    lastAirDate: string | null;
    startedAiring: boolean;
    started: boolean;
    complete: boolean;
    unSkipped: EpisodeModel[];
    skipUntilSeries: number | null;
    lastWatched: string | null;
    latestEpisode: string | null;
    watchedRecently: boolean;
}

export interface ShowSettings {
    recommendedBy: string | null;
    downloadLimit: number | null;
    deleteWatched: boolean;
    watchFromNextPlayable: boolean;
    downloadAllTogether: boolean;
    skipUntilSeries: number;
}

//File: ../../Models/EpisodeId.cs

export interface EpisodeId {
    id: number;
    section: SiteSection;
}

//File: ../../../MediaLife.Library/Models/SiteSection.cs

export interface ShowModelContext {
    siteSection: SiteSection;
    pageType: PageType;
}

export enum SiteSection {
    Lists = 'lists',
    TV = 'tv',
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
    episodeId: number;
    siteSection: SiteSection;
    hash: string;
    name: string;
    added: string;
    lastPercentage: number;
    manuallyAdded: boolean;
}

//File: ../../../MediaLife.Library/DAL/TvNetwork.cs

export interface TvNetwork {
    networkId: number;
    name: string | null;
    countryCode: string | null;
    homepageUrl: string | null;
    searchUrl: string | null;
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
    showId: number;
    siteSection: SiteSection;
    name: string;
    poster: string | null;
    networkId: number | null;
    updated: string;
    added: string;
    recommendedBy: string | null;
    deleteWatched: boolean;
    watchFromNextPlayable: boolean;
    downloadAllTogether: boolean;
    downloadLimit: number | null;
}

//File: ../../../MediaLife.Library/DAL/User.cs

export interface User {
    userId: number;
    accountId: number;
    name: string;
    password: string;
    role: UserRole;
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
    episodeId: number;
    siteSection: SiteSection;
    rank: number;
}

//File: ../../../MediaLife.Library/DAL/UserAccount.cs

export interface UserAccount {
    accountId: number;
    name: string;
}
