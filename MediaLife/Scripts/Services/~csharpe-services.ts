//**
//** This file was written by Gaspar
//**
//** It contains all controllers in:
//**     ../../**/*.cs
//**     only if attributed: [ExportFor] with GasparType.TypeScript or containing group
//**
//** full configuration in: ../../gaspar.config.json
//**

import { ClientData, ClientActions, User, UserAccount, Configuration, VLCStatus, ShowModel, SiteSection, EpisodeModel, UserShow, ShowSettings, EpisodeId, PirateBay } from "../Models/~csharpe-models";
import { ServiceErrorHandler } from "./service-error-handler";

export class ServiceResponse<T> {
    data: T | null;
    error: ActionResultError | null;
    success: boolean;
    hasError: boolean;
    constructor(data: T | null, error: ActionResultError | null) {
        this.data = data;
        this.error = error;
        this.success = error == null;
        this.hasError = error != null;
    }
}
export interface ActionResultError {
    detail: string,
    instance: string,
    status: number,
    title: string,
    traceId: string,
    type: string,
}
export enum ServiceErrorMessage {
    None,
    Generic,
    ServerResponse,
}
export type JsonPropertyKeyMap = Record<string, { k?: string, m?: JsonPropertyKeyMap }>;
export class GasparServiceHelper {
    async fetch<T>(url: string, options: RequestInit, responseIsString: boolean, returnKeyMap: JsonPropertyKeyMap | null, showError: ServiceErrorMessage): Promise<ServiceResponse<T>> {
        return fetch(url, options).then(async response => {
            if (response.ok) {
                try {
                    let data = await (responseIsString ? (response.status == 200 ? response.text() : null) : response.json());
                    if (returnKeyMap) { data = JsonPropertyKeys.fromJson(data, returnKeyMap); }
                    return new ServiceResponse<T>(data, null);
                } catch {}
            }
            return this.responseErrorHandler<T>(response, showError);
        }).catch((reason: Error) => this.caughtErrorHandler<T>(reason, url, showError));
    }
    async responseErrorHandler<T>(response: Response, showError: ServiceErrorMessage): Promise<ServiceResponse<T>> {
        let error: ActionResultError = await response.text().then((body: any) => {
            try {
                return JSON.parse(body);
            }
            catch {
                return { status: response.status, title: response.statusText, detail: body } as ActionResultError
            }
        });
        return this.actionResultErrorHandler(error, showError);
    }
    async caughtErrorHandler<T>(caughtError: Error, url: string, showError: ServiceErrorMessage): Promise<ServiceResponse<T>> {
        console.error(url, caughtError);
        let error = { status: -1, title: caughtError.name, detail: caughtError.message } as ActionResultError;
        return this.actionResultErrorHandler(error, showError);
    }
    async actionResultErrorHandler<T>(error: ActionResultError, showError: ServiceErrorMessage): Promise<ServiceResponse<T>> {
        if (showError != ServiceErrorMessage.None) {
            new ServiceErrorHandler().showError(showError == ServiceErrorMessage.ServerResponse && (error?.detail || error?.title) ? error.detail || error.title : null);
        }
        return new ServiceResponse<T>(null, error);
    }
}
export namespace JsonPropertyKeys {
    export function ClientData(): JsonPropertyKeyMap { return { 'torrents': { m: JsonPropertyKeys.ClientTorrent() } } }
    export function ClientTorrent(): JsonPropertyKeyMap { return { 'torrents': { m: JsonPropertyKeys.PirateBayTorrent() } } }
    export function ClientActions(): JsonPropertyKeyMap { return { 'deleteTorrents': { m: JsonPropertyKeys.ClientTorrent() }, 'saveAndDeleteTorrents': { m: JsonPropertyKeys.ClientTorrent() }, 'addTorrents': { m: JsonPropertyKeys.ClientTorrent() } } }
    export function PirateBayTorrent(): JsonPropertyKeyMap { return { 'hash': { k: 'info_hash' }, 'name': { k: 'name' } } }
    
    export function toJson<T>(obj: T, map: JsonPropertyKeyMap): T {
        if (obj === null) {
            return obj
        }
        if (Array.isArray(obj)) {
            let workingArr = [...obj] as any
            for (let i = 0; i < workingArr.length; i++) {
                workingArr[i] = toJson(workingArr[i], map);
            }
            return workingArr
        } else {
            let workingObj = {...obj} as any
            Object.keys(map).forEach(key => {
                if (workingObj[key] !== undefined) {
                    workingObj[map[key].k ?? key] = map[key].m ? toJson(workingObj[key], map[key].m!) : workingObj[key]
                    if (map[key].k && key != map[key].k) {
                        delete workingObj[key]
                    }
                }
            })
            return workingObj
        }
    }
    export function fromJson<T>(obj: T, map: JsonPropertyKeyMap): T {
        if (obj === null) {
            return obj
        }
        if (Array.isArray(obj)) {
            let workingArr = [...obj] as any
            for (let i = 0; i < workingArr.length; i++) {
                workingArr[i] = fromJson(workingArr[i], map);
            }
            return workingArr
        } else {
            let workingObj = {...obj} as any
            Object.keys(map).forEach(key => {
                if (workingObj[map[key].k ?? key] !== undefined) {
                    workingObj[key] = map[key].m ? fromJson(workingObj[map[key].k ?? key], map[key].m!) : workingObj[map[key].k ?? key]
                    if (map[key].k && key != map[key].k) {
                        delete workingObj[map[key].k ?? key]
                    }
                }
            })
            return workingObj
        }
    }
}

export namespace MediaLifeService {

    //File: ../../Controllers/UpdateController.cs

    export class UpdateController {
        runUpdate(clientData: ClientData, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ClientActions>> {
            clientData = JsonPropertyKeys.toJson(clientData, JsonPropertyKeys.ClientData())
            return new GasparServiceHelper().fetch(`/Update/client`, { method: 'POST', body: JSON.stringify(clientData), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, JsonPropertyKeys.ClientActions(), showError);
        }
    }
    
    //File: ../../Controllers/UsersApiController.cs

    export class UsersApiController {
        getUsers(showError = ServiceErrorMessage.None): Promise<ServiceResponse<User[]>> {
            return new GasparServiceHelper().fetch(`/UsersApi/GetUsers`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        getAccounts(showError = ServiceErrorMessage.None): Promise<ServiceResponse<UserAccount[]>> {
            return new GasparServiceHelper().fetch(`/UsersApi/GetAccounts`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        addAccount(username: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/UsersApi/AddAccount?username=${username || ""}`, { method: 'POST', credentials: 'include' }, false, null, showError);
        }
        renameAccount(accountId: number, name: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<UserAccount>> {
            return new GasparServiceHelper().fetch(`/UsersApi/RenameAccount/${accountId}?name=${name || ""}`, { method: 'POST', credentials: 'include' }, false, null, showError);
        }
        addUser(accountId: number, username: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<User>> {
            return new GasparServiceHelper().fetch(`/UsersApi/AddUser/${accountId}?username=${username || ""}`, { method: 'POST', credentials: 'include' }, false, null, showError);
        }
        editUser(userModel: User, showError = ServiceErrorMessage.None): Promise<ServiceResponse<User>> {
            return new GasparServiceHelper().fetch(`/UsersApi/EditUser`, { method: 'POST', body: JSON.stringify(userModel), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
    }
    
    //File: ../../Controllers/ConfigController.cs

    export class ConfigController {
        update(config: Record<string, string>, showError = ServiceErrorMessage.None): Promise<ServiceResponse<Configuration>> {
            return new GasparServiceHelper().fetch(`/Config`, { method: 'POST', body: JSON.stringify(config), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
    }
    
    //File: ../../Controllers/VLCController.cs

    export class VLCController {
        status(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        open(path: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Open?path=${path || ""}`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        close(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Close`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        play(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Play`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        pause(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Pause`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        fullscreen(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Fullscreen`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        skip(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Skip`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        skipBack(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/SkipBack`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        seekTo(percent: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/SeekTo/${percent}`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        getShow(filename: string | null, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/?filename=${filename || 0}`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
    }
    
    //File: ../../Controllers/HomeController.cs

    export class HomeController {
        watching(showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/watching`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        notStarted(showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/notstarted`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        allShows(showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/all`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        searchResults(section: SiteSection, q: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/${section}/search?q=${q || ""}`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        addShow(section: SiteSection, showId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/${section}/add/${showId}`, { method: 'POST', credentials: 'include' }, false, null, showError);
        }
        removeShow(section: SiteSection, showId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/${section}/remove/${showId}`, { method: 'DELETE', credentials: 'include' }, false, null, showError);
        }
        updateShow(section: SiteSection, showId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/${section}/update/${showId}`, { method: 'POST', credentials: 'include' }, false, null, showError);
        }
        setYouTubePublishedDate(episodeId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<string | null>> {
            return new GasparServiceHelper().fetch(`/SetYouTubePublishedDate/${episodeId}`, { method: 'POST', credentials: 'include' }, true, null, showError);
        }
        setShowPoster(section: SiteSection, showId: string, posterUrl: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/${section}/poster/${showId}`, { method: 'POST', body: JSON.stringify(posterUrl), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
        episode(section: SiteSection, episodeId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<EpisodeModel>> {
            return new GasparServiceHelper().fetch(`/${section}/Episode/${episodeId}`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        removeFilters(section: SiteSection, showId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<UserShow>> {
            return new GasparServiceHelper().fetch(`/${section}/RemoveFilters/${showId}`, { method: 'PUT', credentials: 'include' }, false, null, showError);
        }
        saveSettings(section: SiteSection, showId: string, model: ShowSettings, showError = ServiceErrorMessage.None): Promise<ServiceResponse<string>> {
            return new GasparServiceHelper().fetch(`/${section}/SaveSettings/${showId}`, { method: 'PUT', body: JSON.stringify(model), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, true, null, showError);
        }
        updateEpisode(section: SiteSection, updateAllUsers: boolean, showId: string, episode: EpisodeModel, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/${section}/UpdateEpisode/${updateAllUsers}/${showId}`, { method: 'PUT', body: JSON.stringify(episode), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
        addTorrentHash(episode: EpisodeModel, hash: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<EpisodeModel>> {
            return new GasparServiceHelper().fetch(`/AddTorrentHash/${hash}`, { method: 'POST', body: JSON.stringify(episode), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
        createList(name: string, episodes: EpisodeId[], showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/CreateList/${name}`, { method: 'PUT', body: JSON.stringify(episodes), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
        addToList(listId: number, episodes: EpisodeId[], showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/AddToList/${listId}`, { method: 'PUT', body: JSON.stringify(episodes), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
        updateList(id: number, name: string, episodes: EpisodeId[], showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/UpdateList/${id}/${name}`, { method: 'PUT', body: JSON.stringify(episodes), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
        deleteList(id: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/DeleteList/${id}`, { method: 'DELETE', credentials: 'include' }, false, null, showError);
        }
    }
    
    //File: ../../Controllers/LoginController.cs

    export class LoginController {
        createFirstUser(user: User, showError = ServiceErrorMessage.None): Promise<ServiceResponse<User>> {
            return new GasparServiceHelper().fetch(`/Login/CreateFirstUser`, { method: 'POST', body: JSON.stringify(user), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
        resetPassKey(showError = ServiceErrorMessage.None): Promise<ServiceResponse<string[]>> {
            return new GasparServiceHelper().fetch(`/Login/ResetPassKey`, { method: 'POST', credentials: 'include' }, false, null, showError);
        }
    }
    
    //File: ../../Controllers/PirateBayApiController.cs

    export class PirateBayApiController {
        get(showError = ServiceErrorMessage.None): Promise<ServiceResponse<PirateBay[]>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
        add(newUrl: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<PirateBay>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi`, { method: 'POST', body: JSON.stringify(newUrl), headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, false, null, showError);
        }
        activate(id: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi/${id}`, { method: 'PUT', credentials: 'include' }, false, null, showError);
        }
        delete(id: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<PirateBay>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi/${id}`, { method: 'DELETE', credentials: 'include' }, false, null, showError);
        }
        test(id: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi/Test/${id}`, { method: 'GET', credentials: 'include' }, false, null, showError);
        }
    }
    
}