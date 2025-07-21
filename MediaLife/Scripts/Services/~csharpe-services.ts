//**
//** This file was written by Gaspar
//**
//** It contains all controllers in:
//**     ../../**/*.cs
//**     only if attributed: [ExportFor] with GasparType.TypeScript or containing group
//**
//** full configuration in: ../../gaspar.config.json
//**

import { ClientData, ClientActions, User, UserAccount, Configuration, VLCStatus, SiteSection, ShowModel, EpisodeModel, UserShow, ShowSettings, Show, EpisodeId, PirateBay } from "../Models/~csharpe-models";
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
export class GasparServiceHelper {
    async fetch<T>(url: string, options: RequestInit, showError: ServiceErrorMessage): Promise<ServiceResponse<T>> {
        return fetch(url, options).then(async response => {
            if (response.ok) {
                try {
                    return new ServiceResponse<T>(await response.json(), null);
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

export namespace MediaLifeService {

    //File: ../../Controllers/UpdateController.cs

    export class UpdateController {
        runUpdate(clientData: ClientData, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ClientActions>> {
            return new GasparServiceHelper().fetch(`/Update/client`, { method: 'POST', credentials: 'include', body: JSON.stringify(clientData), headers: { 'Content-Type': 'application/json' } }, showError);
        }
    }
    
    //File: ../../Controllers/UsersApiController.cs

    export class UsersApiController {
        getUsers(showError = ServiceErrorMessage.None): Promise<ServiceResponse<User[]>> {
            return new GasparServiceHelper().fetch(`/UsersApi/GetUsers`, { method: 'GET', credentials: 'include' }, showError);
        }
        getAccounts(showError = ServiceErrorMessage.None): Promise<ServiceResponse<UserAccount[]>> {
            return new GasparServiceHelper().fetch(`/UsersApi/GetAccounts`, { method: 'GET', credentials: 'include' }, showError);
        }
        addAccount(username: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/UsersApi/AddAccount?username=${username || ""}`, { method: 'POST', credentials: 'include' }, showError);
        }
        renameAccount(accountId: number, name: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<UserAccount>> {
            return new GasparServiceHelper().fetch(`/UsersApi/RenameAccount/${accountId}?name=${name || ""}`, { method: 'POST', credentials: 'include' }, showError);
        }
        addUser(accountId: number, username: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<User>> {
            return new GasparServiceHelper().fetch(`/UsersApi/AddUser/${accountId}?username=${username || ""}`, { method: 'POST', credentials: 'include' }, showError);
        }
        editUser(userModel: User, showError = ServiceErrorMessage.None): Promise<ServiceResponse<User>> {
            return new GasparServiceHelper().fetch(`/UsersApi/EditUser`, { method: 'POST', credentials: 'include', body: JSON.stringify(userModel), headers: { 'Content-Type': 'application/json' } }, showError);
        }
    }
    
    //File: ../../Controllers/ConfigController.cs

    export class ConfigController {
        update(config: Record<string, string>, showError = ServiceErrorMessage.None): Promise<ServiceResponse<Configuration>> {
            return new GasparServiceHelper().fetch(`/Config`, { method: 'POST', credentials: 'include', body: JSON.stringify(config), headers: { 'Content-Type': 'application/json' } }, showError);
        }
    }
    
    //File: ../../Controllers/VLCController.cs

    export class VLCController {
        status(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC`, { method: 'GET', credentials: 'include' }, showError);
        }
        open(path: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Open?path=${path || ""}`, { method: 'GET', credentials: 'include' }, showError);
        }
        close(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Close`, { method: 'GET', credentials: 'include' }, showError);
        }
        play(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Play`, { method: 'GET', credentials: 'include' }, showError);
        }
        pause(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Pause`, { method: 'GET', credentials: 'include' }, showError);
        }
        fullscreen(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Fullscreen`, { method: 'GET', credentials: 'include' }, showError);
        }
        skip(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Skip`, { method: 'GET', credentials: 'include' }, showError);
        }
        skipBack(showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/SkipBack`, { method: 'GET', credentials: 'include' }, showError);
        }
        seekTo(percent: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/SeekTo/${percent}`, { method: 'GET', credentials: 'include' }, showError);
        }
    }
    
    //File: ../../Controllers/HomeController.cs

    export class HomeController {
        watching(showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/watching`, { method: 'GET', credentials: 'include' }, showError);
        }
        notStarted(showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/notstarted`, { method: 'GET', credentials: 'include' }, showError);
        }
        allShows(showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/all`, { method: 'GET', credentials: 'include' }, showError);
        }
        searchResults(section: SiteSection, q: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/${section}/search?q=${q || ""}`, { method: 'GET', credentials: 'include' }, showError);
        }
        addShow(section: SiteSection, showId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/${section}/add/${showId}`, { method: 'POST', credentials: 'include' }, showError);
        }
        removeShow(section: SiteSection, showId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/${section}/remove/${showId}`, { method: 'DELETE', credentials: 'include' }, showError);
        }
        updateShow(section: SiteSection, showId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/${section}/update/${showId}`, { method: 'POST', credentials: 'include' }, showError);
        }
        setShowPoster(section: SiteSection, showId: string, posterUrl: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/${section}/poster/${showId}`, { method: 'POST', credentials: 'include', body: `"${posterUrl}"`, headers: { 'Content-Type': 'application/json' } }, showError);
        }
        episode(section: SiteSection, episodeId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<EpisodeModel>> {
            return new GasparServiceHelper().fetch(`/${section}/Episode/${episodeId}`, { method: 'GET', credentials: 'include' }, showError);
        }
        removeFilters(section: SiteSection, showId: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<UserShow>> {
            return new GasparServiceHelper().fetch(`/${section}/RemoveFilters/${showId}`, { method: 'PUT', credentials: 'include' }, showError);
        }
        saveSettings(section: SiteSection, showId: string, model: ShowSettings, showError = ServiceErrorMessage.None): Promise<ServiceResponse<Show>> {
            return new GasparServiceHelper().fetch(`/${section}/SaveSettings/${showId}`, { method: 'PUT', credentials: 'include', body: JSON.stringify(model), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        updateEpisode(section: SiteSection, updateAllUsers: boolean, showId: string, episode: EpisodeModel, showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/${section}/UpdateEpisode/${updateAllUsers}/${showId}`, { method: 'PUT', credentials: 'include', body: JSON.stringify(episode), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        addTorrentHash(episode: EpisodeModel, hash: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<EpisodeModel>> {
            return new GasparServiceHelper().fetch(`/AddTorrentHash/${hash}`, { method: 'POST', credentials: 'include', body: JSON.stringify(episode), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        createList(name: string, episodes: EpisodeId[], showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/CreateList/${name}`, { method: 'PUT', credentials: 'include', body: JSON.stringify(episodes), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        addToList(listId: number, episodes: EpisodeId[], showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/AddToList/${listId}`, { method: 'PUT', credentials: 'include', body: JSON.stringify(episodes), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        updateList(id: number, name: string, episodes: EpisodeId[], showError = ServiceErrorMessage.None): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/UpdateList/${id}/${name}`, { method: 'PUT', credentials: 'include', body: JSON.stringify(episodes), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        deleteList(id: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/DeleteList/${id}`, { method: 'DELETE', credentials: 'include' }, showError);
        }
    }
    
    //File: ../../Controllers/LoginController.cs

    export class LoginController {
        createFirstUser(user: User, showError = ServiceErrorMessage.None): Promise<ServiceResponse<User>> {
            return new GasparServiceHelper().fetch(`/Login/CreateFirstUser`, { method: 'POST', credentials: 'include', body: JSON.stringify(user), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        resetPassKey(showError = ServiceErrorMessage.None): Promise<ServiceResponse<string[]>> {
            return new GasparServiceHelper().fetch(`/Login/ResetPassKey`, { method: 'POST', credentials: 'include' }, showError);
        }
    }
    
    //File: ../../Controllers/PirateBayApiController.cs

    export class PirateBayApiController {
        get(showError = ServiceErrorMessage.None): Promise<ServiceResponse<PirateBay[]>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi`, { method: 'GET', credentials: 'include' }, showError);
        }
        add(newUrl: string, showError = ServiceErrorMessage.None): Promise<ServiceResponse<PirateBay>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi`, { method: 'POST', credentials: 'include', body: JSON.stringify(newUrl), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        activate(id: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi/${id}`, { method: 'PUT', credentials: 'include' }, showError);
        }
        delete(id: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<PirateBay>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi/${id}`, { method: 'DELETE', credentials: 'include' }, showError);
        }
        test(id: number, showError = ServiceErrorMessage.None): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi/Test/${id}`, { method: 'GET', credentials: 'include' }, showError);
        }
    }
    
}