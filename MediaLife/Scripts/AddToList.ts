import { createCookie, eraseCookie, readCookie } from "./BRLibraries/Cookies";
import { $ } from "./BRLibraries/DOM";
import { tsEpisodeId } from "./Models/extendedModels";
import { EpisodeId, EpisodeModel, ListEntry, ShowModel, SiteSection } from "./Models/~csharpe-models";
import { MedialifeService } from "./Services/~csharpe-services";

export class AddToList {

	service = new MedialifeService.HomeController();

	addToList: { id: number, name: string, episodes: ListEntry[] } | null;
	queuedEpisodes: tsEpisodeId[] = [];
	creating: boolean = false;

    constructor() {
		var cookie = readCookie('listMode');
		this.addToList = cookie == null ? null : JSON.parse(cookie);
		if (cookie != null) {
			setTimeout(() => this.enterAddMode());
		}
	}

	enterAddMode() {
		window.site.showSnackBar('Adding to list:<br /><b>' + this.addToList?.name + '</b><br/><a href="JavaScript:;" onclick="addToListMode.end();">' + (this.addToList?.id == 0 ? 'Cancel' : 'Done') + '</a>');
		$('content').addClass('add-to-list-mode');
    }

	save() {
		if (this.addToList != null) {
			createCookie('listMode', JSON.stringify(this.addToList));
		} else {
			eraseCookie('listMode');
		}
	}

	create(name: string) {
		this.addToList = {
			id: 0,
			name: name,
			episodes: []
		};
		this.enterAddMode();
		this.save();
    }

	start(showModel: ShowModel, redirectSection: string) {
		this.updateAddToListFromShowModel(showModel);
		location.href = '/' + redirectSection;
	}

	end() {
		if (this.addToList?.id == 0) {
			this.addToList = null;
			window.site.closeSnackBar();
			$('content').removeClass('add-to-list-mode');
		} else {
			var url = '/lists/' + this.addToList?.id.toString();
			this.addToList = null;
			location.href = url;
		}
		this.save();
	}

	contains(episode: EpisodeModel) {
		if (this.addToList != null) {
			return this.addToList.episodes.find(e => e.episodeId == episode.id && e.siteSection == episode.siteSection) != null;
		}
	}
	containsId(episode: tsEpisodeId) {
		if (this.addToList != null) {
			return this.addToList.episodes.find(e => e.episodeId == episode.id && e.siteSection == episode.section) != null;
		}
	}

	containsAll(episodeIds: tsEpisodeId[]) {
		if (this.addToList != null) {
			for (var i = 0; i < episodeIds.length; i++) {
				if (this.addToList.episodes.find(e => e.episodeId == episodeIds[i].id && e.siteSection == episodeIds[i].section) == null) {
					return false;
				}
			}
		} else {
			return false;
        }
		return true;
    }

	add(episodes: tsEpisodeId[], callback: (episodes: tsEpisodeId[]) => void) {

		if (this.creating) {
			this.queuedEpisodes = this.queuedEpisodes.concat(episodes);

		} else if (this.addToList) {

			var episodesToAdd: EpisodeId[] = [];
			for (var i = 0; i < episodes.length; i++) {
				if (!this.containsId(episodes[i])) {
					episodesToAdd.push(this.getEpisodeFromId(episodes[i]));
				}
			}

			if (episodesToAdd.length > 0) {

				let list = [...this.addToList.episodes.map(e => ({ id: e.episodeId, section: e.siteSection } as EpisodeId)), ...episodesToAdd];

				if (this.addToList?.id == 0) {
					this.service.createList(this.addToList.name, list).then(response => {
						if (response.data) {
							this.updateAddToListFromShowModel(response.data);
							if (this.queuedEpisodes.length > 0) {
								this.add(this.queuedEpisodes, callback);
								this.queuedEpisodes = [];
							}
						}
						callback(episodes)
						this.enterAddMode();
					});

				} else {
					
					this.service.addToList(this.addToList?.id, list).then(response => {
						if (response.data) {
							this.updateAddToListFromShowModel(response.data);
						}
						callback(episodes)
						this.enterAddMode();
					})
				}
			}
		}
	}

	updateAddToListFromShowModel(showModel: ShowModel) {

		var episodes = [];
		for (var i = 0; i < showModel.episodes.length; i++) {
			episodes.push(this.getEpisodeFromModel(showModel.episodes[i]));
		}

		this.addToList = {
			id: showModel.id,
			name: showModel.name,
			episodes: episodes
		};
		this.save();
	}

	getEpisodeFromModel(episode: EpisodeModel): ListEntry {
		return { episodeId: episode.id, siteSection: episode.siteSection } as ListEntry;
    }

	getEpisodeFromId(episode: tsEpisodeId): EpisodeId {
		return { id: episode.id, section: episode.section } as EpisodeId;
    }

}