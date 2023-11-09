//**
//** This file was written by Gaspar
//**
//** It contains all controllers in:
//**     ../../**/*.cs
//**     only if attributed: [ExportFor] with GasparType.TypeScript or containing group
//**
//** full configuration in: ../../gaspar.config.json
//**

import { User, Account, Configuration, VLCStatus, SiteSection, ShowModel, EpisodeModel, ShowSettings, Show, EpisodeId, PirateBay } from "../Models/~csharpe-models";
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

    //File: ../../Controllers/UsersApiController.cs

    export class UsersApiController {
        getUsers(showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<User[]>> {
            return new GasparServiceHelper().fetch(`/UsersApi/GetUsers`, { method: 'GET' }, showError);
        }
        getAccounts(showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<Account[]>> {
            return new GasparServiceHelper().fetch(`/UsersApi/GetAccounts`, { method: 'GET' }, showError);
        }
        addAccount(username: string, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/UsersApi/AddAccount?username=${username || ""}`, { method: 'POST' }, showError);
        }
        renameAccount(accountId: number, name: string, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<Account>> {
            return new GasparServiceHelper().fetch(`/UsersApi/RenameAccount/${accountId}?name=${name || ""}`, { method: 'POST' }, showError);
        }
        addUser(accountId: number, username: string, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<User>> {
            return new GasparServiceHelper().fetch(`/UsersApi/AddUser/${accountId}?username=${username || ""}`, { method: 'POST' }, showError);
        }
        editUser(userModel: User, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<User>> {
            return new GasparServiceHelper().fetch(`/UsersApi/EditUser`, { method: 'POST', body: JSON.stringify(userModel), headers: { 'Content-Type': 'application/json' } }, showError);
        }
    }
    
    //File: ../../Controllers/ConfigController.cs

    export class ConfigController {
        update(config: Record<string, string>, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<Configuration>> {
            return new GasparServiceHelper().fetch(`/Config`, { method: 'POST', body: JSON.stringify(config), headers: { 'Content-Type': 'application/json' } }, showError);
        }
    }
    
    //File: ../../Controllers/VLCController.cs

    export class VLCController {
        status(showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC`, { method: 'GET' }, showError);
        }
        open(path: string, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Open?path=${path || ""}`, { method: 'GET' }, showError);
        }
        play(showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Play`, { method: 'GET' }, showError);
        }
        pause(showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Pause`, { method: 'GET' }, showError);
        }
        fullscreen(showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Fullscreen`, { method: 'GET' }, showError);
        }
        skip(showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/Skip`, { method: 'GET' }, showError);
        }
        skipBack(showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/SkipBack`, { method: 'GET' }, showError);
        }
        seekTo(percent: number, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<VLCStatus | null>> {
            return new GasparServiceHelper().fetch(`/VLC/SeekTo/${percent}`, { method: 'GET' }, showError);
        }
    }
    
    //File: ../../Controllers/HomeController.cs

    export class HomeController {
        watching(section: SiteSection, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/${section}/watching`, { method: 'GET' }, showError);
        }
        notStarted(section: SiteSection, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/${section}/notstarted`, { method: 'GET' }, showError);
        }
        allShows(section: SiteSection, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<ShowModel[]>> {
            return new GasparServiceHelper().fetch(`/${section}/all`, { method: 'GET' }, showError);
        }
        addShow(section: SiteSection, showId: number, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/${section}/add/${showId}`, { method: 'POST' }, showError);
        }
        removeShow(section: SiteSection, showId: number, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/${section}/remove/${showId}`, { method: 'DELETE' }, showError);
        }
        updateShow(section: SiteSection, showId: number, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/${section}/update/${showId}`, { method: 'POST' }, showError);
        }
        episode(section: SiteSection, episodeId: number, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<EpisodeModel>> {
            return new GasparServiceHelper().fetch(`/${section}/Episode/${episodeId}`, { method: 'GET' }, showError);
        }
        saveSettings(section: SiteSection, showId: number, model: ShowSettings, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<Show>> {
            return new GasparServiceHelper().fetch(`/${section}/SaveSettings/${showId}`, { method: 'PUT', body: JSON.stringify(model), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        updateEpisode(section: SiteSection, showId: number, episode: EpisodeModel, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/${section}/UpdateEpisode/${showId}`, { method: 'PUT', body: JSON.stringify(episode), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        addTorrentHash(episode: EpisodeModel, hash: string, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<EpisodeModel>> {
            return new GasparServiceHelper().fetch(`/AddTorrentHash/${hash}`, { method: 'POST', body: JSON.stringify(episode), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        createList(name: string, episodes: EpisodeId[], showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/CreateList/${name}`, { method: 'PUT', body: JSON.stringify(episodes), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        addToList(listId: number, episodes: EpisodeId[], showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<ShowModel>> {
            return new GasparServiceHelper().fetch(`/AddToList/${listId}`, { method: 'PUT', body: JSON.stringify(episodes), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        updateList(id: number, name: string, episodes: EpisodeId[], showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<ShowModel | null>> {
            return new GasparServiceHelper().fetch(`/UpdateList/${id}/${name}`, { method: 'PUT', body: JSON.stringify(episodes), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        deleteList(id: number, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/DeleteList/${id}`, { method: 'DELETE' }, showError);
        }
    }
    
    //File: ../../Controllers/LoginController.cs

    export class LoginController {
        createFirstUser(user: User, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<User>> {
            return new GasparServiceHelper().fetch(`/Login/CreateFirstUser`, { method: 'POST', body: JSON.stringify(user), headers: { 'Content-Type': 'application/json' } }, showError);
        }
    }
    
    //File: ../../Controllers/PirateBayApiController.cs

    export class PirateBayApiController {
        get(showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<PirateBay[]>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi`, { method: 'GET' }, showError);
        }
        add(newUrl: string, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<PirateBay>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi`, { method: 'POST', body: JSON.stringify(newUrl), headers: { 'Content-Type': 'application/json' } }, showError);
        }
        activate(id: number, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi/${id}`, { method: 'PUT' }, showError);
        }
        delete(id: number, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<PirateBay>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi/${id}`, { method: 'DELETE' }, showError);
        }
        test(id: number, showError = ServiceErrorMessage.Generic): Promise<ServiceResponse<boolean>> {
            return new GasparServiceHelper().fetch(`/PirateBayApi/Test/${id}`, { method: 'GET' }, showError);
        }
    }
    
}