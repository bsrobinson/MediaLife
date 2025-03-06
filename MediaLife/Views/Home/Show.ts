import { element, elementOrNull, elementsOfClass, firstOfClass, firstOfClassOrNull, makeElement } from "../../Scripts/BRLibraries/DOM";
import { windowSize } from "../../Scripts/BRLibraries/WindowSize";
import { EpisodeFileIcon } from "../../Scripts/EpisodeFileIcon";
import { EpisodeObject } from "../../Scripts/EpisodeObject";
import { EpisodeWatchIcon } from "../../Scripts/EpisodeWatchIcon";
import { tsEpisodeModel, tsShowModel, tsShowModelForList } from "../../Scripts/Models/extendedModels";
import { EpisodeId, EpisodeModel, ShowPageModel, ShowSettings, SiteSection, WatchedStatus } from "../../Scripts/Models/~csharpe-models";
import { MediaLifeService } from "../../Scripts/Services/~csharpe-services";
import { MediaLife } from "../../Scripts/Site";
import '../../Scripts/BRLibraries/Form';
import { makeButton, makeFormRow } from "../../Scripts/BRLibraries/Form";
import { BrandIcon, Icon } from "../../Scripts/BRLibraries/Icon";

//Live!

//Merge UI
//  Button on parent page (poss new settings menu?)
//  Button opens popup showing existing children (for removal),
//      and all other shows you might want to add, with filter, but sorted by lev distance so likely is on top
export class HomeShow {

    service = new MediaLifeService.HomeController();

    activeSeries: number | null = null;
    editedList: tsShowModelForList | null = null;

    removeFiltersButton: HTMLButtonElement | null = null;

    resized = false;

    constructor(private site: MediaLife, private data: ShowPageModel) {
    }

    init() {

        let lastSeries = this.data.show.episodes.find(e => e.mergedFromShow == null && !e.userHasWatched)?.seriesNumber
        let maxSeries = Math.max(...this.data.show.episodes.map(e => e.seriesNumber));
        if (!lastSeries) {
            lastSeries = maxSeries;
        }
        if (!this.data.show.hideWatched && !this.data.show.hideUnplayable) {
            this.activeSeries = lastSeries;
        }

        if (elementOrNull('series_list')) {
            element('series_list').innerHTML = '';
            if (maxSeries > 999) { element('series_list_wrapper').addClass('wide'); }
            let series = [...new Set(this.data.show.episodes.filter(e => e.mergedFromShow == null).map(e => e.seriesNumber))].sort((a, b) => a - b);

            element('series_list').appendElement('li').appendElement('a', { html: 'All', href: 'JavaScript:;', events: { click: (e: Event) => this.selectSeries(e) } });
            for (let i = 0; i < series.length; i++) {
                element('series_list')
                    .appendElement('li', { class: series[i] == this.activeSeries ? 'active' : '' })
                    .appendElement('a', { html: series[i].toString(), href: 'JavaScript:;', events: { click: (e: Event) => this.selectSeries(e) } });
            }
        }

        this.drawEpisodes();
        this.drawPoster();

        if (this.data.show.isAdded) {

            this.service.updateShow(this.data.showListOptions ? SiteSection.Lists : this.data.siteSection, this.data.show.id).then(response => {
                if (response.data && !element('content').containsClass('edit-list')) {
                    this.data.show = response.data;
                    element('showName').innerHTML = this.data.show.name;
                    if (elementOrNull('author')) {
                        element('author').innerHTML = this.data.show.showAuthor || '';
                    }
                    this.drawEpisodes();
                    this.drawPoster();
                }
            })
        }
    }

    drawPoster() {

        if (!this.data.show.showEpisodesAsThumbnails) {

            element('poster').innerHTML = '';
            element('poster').style.backgroundImage = '';

            if (this.data.show.episodePosters.length == 1 && this.data.siteSection == SiteSection.Movies) {

                element('poster').style.backgroundImage = "url('" + this.data.show.episodePosters[0] + "')";

            } else if (this.data.show.episodePosters.length > 1 && this.data.siteSection == SiteSection.Movies) {

                for (let i = 0; i < this.data.show.episodePosters.length; i++) {
                    element('poster').appendElement('div', { class: 'mini-poster', style: `background-image:url('${this.data.show.episodePosters[i]}')` })
                }

            } else if (this.data.show.poster) {

                element('poster').style.backgroundImage = "url('" + this.data.show.poster + "')";

            } else {

                element('poster').innerHTML = this.data.show.name;

                element('poster').style.fontSize = '';
                let fontSize = 40;
                while (element('poster').scrollHeight > element('poster').clientHeight || element('poster').scrollWidth > element('poster').clientWidth) {
                    fontSize--;
                    element('poster').style.fontSize = fontSize + 'px';
                }
            }
        }
    }

    selectSeries(event: Event) {

        let seriesButtons = element('series_list').children;
        for (let i = 0; i < seriesButtons.length; i++) {
            (seriesButtons[i] as HTMLElement).removeClass('active')
        }

        if (event.target instanceof HTMLElement) {
            event.target.parentOfType('li')?.addClass('active');
            let seriesHtml = event.target.html();
            this.activeSeries = seriesHtml == 'All' ? null : parseInt(seriesHtml);
            this.drawEpisodes();
        }
    }

    drawEpisodes() {

        let episodeList = element('episode_list')
        episodeList.empty();
        elementOrNull('series_list_wrapper')?.toggleClassIfTrue('hide', this.data.user.simpleMode && this.data.show.userUnwatchedCount > 0)
        element('content').toggleClassIfTrue('simple-mode', this.data.user.simpleMode && this.data.show.userUnwatchedCount > 0)
        element('content').toggleClassIfTrue('simple-mode-thumbnails', this.data.user.simpleMode && this.data.show.userUnwatchedCount > 0 && this.data.show.showEpisodesAsThumbnails)

        if (this.data.user.simpleMode && !this.data.show.showEpisodesAsThumbnails && this.data.show.userUnwatchedCount > 0) {

            let watching = this.data.show.episodes.find(e => e.userStartedWatching && !e.userHasWatched) as tsEpisodeModel
            if (watching) {
                watching.obj ??= new EpisodeObject(this.data.show as tsShowModel, watching);
                episodeList.appendElement('div', { html: 'Watching Episode', class: 'title' })
                episodeList.appendElement('div', { class: 'episode', children: [
                    new EpisodeFileIcon(watching.obj, '').node,
                    makeElement('div', { html: `${watching.seriesEpisodeNumber} - ${watching.name}` }),
                ] })
                episodeList.appendButton(`Watched`, { icon: new Icon('eye'), classes: 'watching', click: (e) => {
                    e.button.disableWithSpinIcon()
                    if (watching.obj) {
                        watching.obj.toggleWatchedTogether(() => {
                            this.drawEpisodes()
                            this.updateEpisodeCount()
                        });
                    }
                } })
            }
            else {
                let nextEpisode = this.data.show.nextEpisode as tsEpisodeModel
                if (nextEpisode) {
                    nextEpisode.obj ??= new EpisodeObject(this.data.show as tsShowModel, nextEpisode);
                    episodeList.appendElement('div', { html: 'Next Episode', class: 'title' })
                    episodeList.appendElement('div', { class: 'episode', children: [
                        new EpisodeFileIcon(nextEpisode.obj, '').node,
                        makeElement('div', { html: `${nextEpisode.seriesEpisodeNumber} - ${nextEpisode.name}` }),
                    ] })
                    episodeList.appendButton(`Play`, { icon: new BrandIcon('youtube'), colour: 'green', click: (e) => {
                        if (nextEpisode.obj) {
                            window.vlc.open(nextEpisode.obj);
                            nextEpisode.obj.toggleStartedWatching(() => {
                                if (this.data.show.episodes.find(e => e.userStartedWatching && !e.userHasWatched)) {
                                    this.drawEpisodes()
                                }
                            })
                        }
                    } })

                }
            }

        } else {

            let episodes = this.data.show.episodes;
            let episodeShown = false;
            let maxDate = new Date(8640000000000000);

            for (let i = 0; i < episodes.length; i++) {
                if ((this.data.siteSection != SiteSection.TV || (this.data.siteSection == SiteSection.TV && (this.activeSeries === null || episodes[i].seriesNumber == this.activeSeries)))
                    && episodes[i].mergedFromShow == null
                    && (!this.data.show.hideWatched || episodes[i].userHasWatched == false)
                    && (!this.data.show.hideUnplayable || episodes[i].filePath != null)
                ) {
                    episodeList.appendChild(this.episodeRow(episodes[i] as tsEpisodeModel, this.data.show.showEpisodesAsThumbnails) as HTMLElement);
                    episodeShown = true;
                    
                    let nextParentEpisode = episodes.find((e, index) => index > i && e.mergedFromShow == null)
                    episodes.filter(e => e.mergedFromShow != null && (e.airDate ?? maxDate) >= (episodes[i].airDate ?? maxDate) && (e.airDate ?? maxDate) < (nextParentEpisode?.airDate ?? maxDate)).forEach(ep => {
                        episodeList.appendChild(this.episodeRow(ep as tsEpisodeModel, this.data.show.showEpisodesAsThumbnails) as HTMLElement);
                    })
                }
            }
            if (!episodeShown) {
                if (episodes.length == 0) {
                    episodeList.appendElement('div', { class: 'episode-row no-episodes', html: 'No episodes' })
                } else {
                    this.removeFiltersButton = makeButton('Remove Filters', { icon: new Icon('filter-circle-xmark'), click: () => this.removeFilters() });
                    episodeList.appendElement('div', { class: 'episode-row no-episodes', html: 'All episodes hidden by filters' })
                        .appendButtonRow([ this.removeFiltersButton ], { justify: 'center' });
                }
            }

            episodeList.appendButton('Add to List', { classes: 'button add edit-list-show', click: () => this.startAddToListMode() });
        }
    }

    episodeRow(episode: tsEpisodeModel, thumbnail: boolean) {

        if (thumbnail) {
            return this.episodeThumbnail(episode)
        }

        let all = this.activeSeries === null;
        let airDate = episode.airDate ? new Date(episode.airDate) : null;
        let available = episode.hasTorrents || episode.filePath;

        let row = elementOrNull('episode_row' + episode.id);
        if (row) {
            row.innerHTML = '';
        } else {
            row = makeElement<HTMLElement>('div', { id: 'episode_row' + episode.id, events: { mouseenter: (e: Event) => this.hoverEpisode(e), mouseleave: () => this.hoverOffEpisode() } });
        }
        row.className = 'episode-row' + ((airDate == null || airDate > new Date()) && !available ? ' future' + (episode.userHasWatched ? '-but-watched' : '') : '');

        let name = row.appendElement('div', { class: 'name-and-number' + (all ? ' wide-number' : '') });
        if (episode.mergedFromShow == null) {
            if (this.data.siteSection != SiteSection.YouTube) {
                name.appendElement('span', { class: 'number', html: (all ? 'S' + episode.seriesNumber + ': ' : '') + episode.number });
            }
            name.appendElement('span', { class: 'name', html: episode.name });
        } else {
            name.appendIcon('code-merge', { click: () => { location.href = `/${episode.mergedFromShow?.siteSection}/${episode.mergedFromShow?.id}` }, htmlAttributes: { style: 'text-indent:0; margin-right:0.4rem;', title: `Merged from\n${episode.mergedFromShow.name}\n${episode.seriesEpisodeNumber}` }})
            name.appendElement('span', { class: 'name', html: `${episode.mergedFromShow.name}: ${episode.name}` });
        }
        name.appendElement('span', { html: ' ' });
        if (airDate && this.data.siteSection != SiteSection.Books) {
            name.appendElement('span', { class: 'date', html: airDate.format('j M Y'), title: this.data.siteSection == SiteSection.TV ? airDate.format('g:i a') + ' GMT' : '' });
        }
        if (this.data.siteSection == SiteSection.Books) {
            if (episode.author != this.data.show.showAuthor) {
                name.appendElement('span', { class: 'author', html: episode.author });
                name.appendElement('span', { html: ' ' });
            }
            if (airDate) {
                name.appendElement('span', { class: 'date', html: airDate.format('Y') });
            }
        }
        if (episode.inLists && episode.inLists.length > 0) {
            let listSpn = name.appendElement('span', { class: 'lists' });
            for (let i = 0; i < episode.inLists.length; i++) {
                listSpn.appendElement('a', { href: '/lists/' + episode.inLists[i].listId, html: '📝 ', title: 'In list ' + episode.inLists[i].name });
            }
        }


        let icons = row.appendElement('div', { class: 'icons' });

        if (!episode.obj) {
            episode.obj = new EpisodeObject(this.data.show as tsShowModel, episode);
        }
        icons.appendChild(new EpisodeFileIcon(episode.obj, 'edit-list-hide add-to-list-hide').node);
        icons.appendChild(new EpisodeWatchIcon(episode.obj, 'edit-list-hide add-to-list-hide').node);

        icons.appendIcon('arrow-up', { class: 'icon edit-list-show', click: (e: Event) => this.moveEpisodeUp(e), htmlAttributes: { title: 'Move up' } });
        icons.appendIcon('arrow-down', { class: 'icon edit-list-show', click: (e: Event) => this.moveEpisodeDown(e), htmlAttributes: { title: 'Move down' } });
        icons.appendIcon('trash-can', { class: 'icon edit-list-show', click: (e: Event) => this.removeEpisode(e), htmlAttributes: { title: 'Remove' } });

        if (window.addToListMode.contains(episode)) {
            icons.appendElement('span', { class: 'add-to-list-show', html: 'In List' });
        } else {
            icons.appendElement('a', { href: 'JavaScript:;', class: 'icon add add-to-list-show', html: 'Add to list', events: { click: (e: Event) => this.addEpisodeToList(e) } });
        }

        return row;
    }

    episodeThumbnail(episode: tsEpisodeModel) {

        let all = this.activeSeries === null;
        let airDate = episode.airDate ? new Date(episode.airDate) : null;
        let available = episode.hasTorrents || episode.filePath;

        let thumbnail = elementOrNull('episode_row' + episode.id);
        if (thumbnail) {
            thumbnail.innerHTML = '';
        } else {
            thumbnail = makeElement<HTMLElement>('div', { id: 'episode_row' + episode.id });
        }
        
        let image = thumbnail.appendElement('a', { href: `JavaScript:;`, events: { click: () => {
            let fileIcon = firstOfClassOrNull('episode-file-icon', element(`episode_row${episode.id}`))
            if (fileIcon) {
                fileIcon.click();
            }
        } } });
        if (episode.poster) {

            image.style.backgroundImage = "url('" + episode.poster + "')";

        } else {

            image.innerHTML = episode.name

            // fit text, where there is no poster
            setTimeout(() => {
                let fontSize = 40;
                while (image.scrollHeight > image.clientHeight || image.scrollWidth > image.clientWidth) {
                    fontSize--;
                    image.style.fontSize = fontSize + 'px';
                }
            });
        }

        thumbnail.className = 'episode-thumbnail' + ((airDate == null || airDate > new Date()) && !available ? ' future' + (episode.userHasWatched ? '-but-watched' : '') : '');

        let nameRow = thumbnail.appendElement('div', { class: 'name-row' });
        if (this.data.siteSection != SiteSection.YouTube) {
            nameRow.appendElement('span', { class: 'number', html: (all ? 'S' + episode.seriesNumber + ': ' : '') + episode.number });
        }
        nameRow.appendElement('span', { class: 'name', html: episode.name });

        let icons = nameRow.appendElement('div', { class: 'icons' });

        if (!episode.obj) {
            episode.obj = new EpisodeObject(this.data.show as tsShowModel, episode);
        }
        icons.appendChild(new EpisodeFileIcon(episode.obj, 'search-page').node);
        icons.appendChild(new EpisodeWatchIcon(episode.obj, 'search-page').node);
        
        return thumbnail;
    }

    hoverEpisode(event: Event) {
        if (event.target instanceof HTMLElement) {
            let id = event.target.id.slice(11);
            let episode = this.data.show.episodes.find(e => e.id == id);
            if (episode && episode.poster) {
                element('poster').innerHTML = '';
                element('poster').style.backgroundImage = "url('" + episode.poster + "')";
            }
        }
    }

    hoverOffEpisode() {
        this.drawPoster();
    }

    addShow() {
        element<HTMLButtonElement>('addShowButton').disableWithSpinIcon();
        this.service.addShow(this.data.show.siteSection, this.data.show.id).then(response => {
            if (response.data) {
                element('showName').html(response.data.name);
                element('addShowButton').addClass('hide');
                element('removeShowButton').removeClass('hide');
                element('showUserButton').removeClass('hide');
                element('showFilterButton').removeClass('hide');
                element('showSettingsButton').removeClass('hide');
                element<HTMLButtonElement>('showUserButton').changeLabel(response.data.activeUserNames);
                response.data.users.forEach(u => {
                    element('userShow_menu').insertBefore(makeFormRow(`Show_User_${u.id}`, { label: u.name, value: u.hasAdded, style: 'blockRow' }), element('userShow_menu').lastElementChild)
                })
                this.data.show.users = response.data.users
                this.windowResize();
            } else {
                element('addShowButton').removeClass('hide');
            }
            element<HTMLButtonElement>('addShowButton').enable();
        });
    }

    removeShow() {
        if (this.data.someEpisodesInList) {
            alert('Cannot remove as some parts are in one or more custom lists');
        } else {
            element<HTMLButtonElement>('removeShowButton').disableWithSpinIcon();
            this.service.removeShow(this.data.show.siteSection, this.data.show.id).then(response => {
                if (response.data) {
                    element('removeShowButton').addClass('hide');
                    element('showUserButton').addClass('hide');
                    element('showFilterButton').addClass('hide');
                    element('showSettingsButton').addClass('hide');
                    element('addShowButton').removeClass('hide');
                } else {
                    element('removeShowButton').removeClass('hide');
                }
                element<HTMLButtonElement>('removeShowButton').enable();
            });
        }
    }

    toggleUserMenu() {
        if (!this.data.user.simpleMode || this.data.show.userUnwatchedCount == 0) {
            let isClosed = element('userShow_menu').containsClass('hide')
            this.closeSettingsMenus()
            if (isClosed) {
                this.openSettingsMenus()
                element('userShow_menu').removeClass('hide');
            }
        }
    }

    toggleFilterMenu() {
        let isClosed = element('filter_menu').containsClass('hide')
        this.closeSettingsMenus()
        if (isClosed) {
            this.openSettingsMenus()
            element('filter_menu').removeClass('hide');
        }
    }

    toggleSettingsMenu() {
        let isClosed = element('settings_menu').containsClass('hide')
        this.closeSettingsMenus()
        if (isClosed) {
            this.openSettingsMenus()
            element('settings_menu').removeClass('hide');
        }
    }

    openSettingsMenus() {
        element('blackout').removeClass('hide');
        element('showUserButton').addClass('open');
        element('showFilterButton').addClass('open');
        element('showSettingsButton').addClass('open');
    }

    closeSettingsMenus() {
        element('blackout').addClass('hide');
        element('userShow_menu').addClass('hide');
        element('filter_menu').addClass('hide');
        element('settings_menu').addClass('hide');
        element('showUserButton').removeClass('open');
        element('showFilterButton').removeClass('open');
        element('showSettingsButton').removeClass('open');
    }

    removeFilters() {
        if (this.removeFiltersButton) {
            this.removeFiltersButton.disableWithSpinIcon();
            this.service.removeFilters(this.data.show.siteSection, this.data.show.id).then(() => {
                location.reload();
            });
        }
    }

    userActiveChanged(e: Event) {
        if (e.target instanceof HTMLInputElement && !e.target.checked && !this.data.show.users.some(u => elementOrNull<HTMLInputElement>(`Show_User_${u.id}`)?.checked ?? false)) {
            setTimeout(() => {
                if (e.target instanceof HTMLInputElement) {
                    window.site.showSnackBar('Show must have at least one user', true)
                    element('snack_bar').style.zIndex = '999999'
                    e.target.checked = true
                    setTimeout(() => {
                        window.site.closeSnackBar()
                        element('snack_bar').style.zIndex = ''
                    }, 1000)
                }
            }, 150)
        }
    }

    saveSettings() {

        this.closeSettingsMenus();
        element<HTMLButtonElement>('showUserButton').disableWithSpinIcon();
        element<HTMLButtonElement>('showFilterButton').disableWithSpinIcon();
        element<HTMLButtonElement>('showSettingsButton').disableWithSpinIcon();

        let form = element<HTMLFormElement>('settings_form').toJson<ShowPageModel>().show as ShowSettings;
        form.users = this.data.show.users;
        form.users.forEach(u => u.hasAdded = elementOrNull<HTMLInputElement>(`Show_User_${u.id}`)?.checked ?? false)

        this.service.saveSettings(this.data.show.siteSection, this.data.show.id, form).then(() => {
            location.reload();
        });
        
    }

    episodeUpdated(episodeObj: EpisodeObject) {

        let episodeIndex = this.data.show.episodes.findIndex(e => e.id == episodeObj.episode.id);
        if (episodeIndex >= 0) {

            this.data.show = episodeObj.show;
            this.data.show.episodes[episodeIndex] = episodeObj.episode;

            this.drawPoster();

            //update buttons
            if (!this.data.showListOptions) {
                if (!this.data.show.episodes.some(e => e.watchStatus != WatchedStatus.Unwatched)) {
                    element('removeShowButton').removeClass('hide');
                    element('showSettingsButton').removeClass('hide');
                } else {
                    element('addShowButton').addClass('hide');
                    element('removeShowButton').addClass('hide');
                    element('showSettingsButton').removeClass('hide');
                    this.data.show.isAdded = true;
                    this.data.show.userAdded = new Date().formatForJson();
                }
            }
        }

        this.updateEpisodeCount()
    }


    updateEpisodeCount() {
        let count = this.data.show.userUnwatchedCount
        element('unwatched_count').toggleClassIfTrue('complete', count == 0)
        if (count == 0) {
            element('unwatched_count').empty()
            element('unwatched_count').appendIcon('check')
        } else {
            element('unwatched_count').html(count.toString())
        }
    }


    simpleModeOff() {
        this.data.user.simpleMode = false;
        this.drawEpisodes()
    }


    openNetwork() {
        let url: string | null = '';
        if (this.data.siteSection == SiteSection.TV && this.data.show.network?.name) {
            url = this.data.show.network.homepageUrl;
        }
        if (this.data.siteSection == SiteSection.YouTube) {
            url = this.data.show.id.slice(0, 2) == 'PL'
                ? `https://www.youtube.com/playlist?list=${this.data.show.id}`
                : `https://www.youtube.com/channel/${this.data.show.id}`;
        }

        if (url) {
            window.open(url);
        }
    }


    editList() {

        element('content').addClass('edit-list');

        this.editedList = { id: this.data.show.id, hasChanges: false } as tsShowModelForList;
        this.editedList.episodes = [];
        
        for (let i = 0; i < this.data.show.episodes.length; i++) {
            let episode = this.data.show.episodes[i];
            this.editedList.episodes.push({ id: episode.id, siteSection: episode.siteSection } as EpisodeModel);
        }
    }
    startAddToListMode() {
        if (this.editedList && this.editedList.hasChanges) {
            if (confirm('Save changes before adding?')) {
                this.editListSave(true);
            }
        } else {
            window.addToListMode.start(this.data.show, this.data.siteSection);
        }
    }
    removeEpisode(event: Event) {
        if (event.target instanceof HTMLElement) {
            let row = event.target.parentOfClass('episode-row');
            if (row) {
                let id = row.id.slice(11);
                let episode = this.data.show.episodes.find(e => e.id == id);
                if (episode) {
                    let index = this.editedListIndex(episode);
                    if (index) {
                        element('episode_row' + episode.id).removeElement();
                        this.editedList?.episodes.splice(index, 1);
                        
                        this.editedListChanged();
                    }
                }
            }
        }
    }
    moveEpisodeUp(event: Event) {
        if (event.target instanceof HTMLElement) {
            let row = event.target.parentOfClass('episode-row');
            if (row) {
                let id = row.id.slice(11);
                let episode = this.data.show.episodes.find(e => e.id == id);

                if (episode && this.editedList) {
                    let index = this.editedListIndex(episode);
                    if (index) {
                        row.parentNode?.insertBefore(row, row.previousElementSibling);
                        this.editedList.episodes[index - 1] = this.editedList.episodes.splice(index, 1, this.editedList.episodes[index - 1])[0];
                        
                        this.editedListChanged();
                    }
                }
            }
        }
    }
    moveEpisodeDown(event: Event) {
        if (event.target instanceof HTMLElement) {
            let row = event.target.parentOfClass('episode-row');
            if (row && this.editedList) {
                let id = row.id.slice(11);
                let episode = this.data.show.episodes.find(e => e.id == id);
                let index = this.editedList.episodes.findIndex(e => e.id == episode?.id && e.siteSection == episode.siteSection);

                if (row.nextElementSibling instanceof HTMLElement && row.nextElementSibling.containsClass('episode-row')) {
                    row.parentNode?.insertBefore(row, row.nextElementSibling?.nextElementSibling);
                    this.editedList.episodes[index + 1] = this.editedList.episodes.splice(index, 1, this.editedList.episodes[index + 1])[0];
                }
                this.editedListChanged();
            }
        }
    }
    editedListIndex(episode: EpisodeModel) {
        return this.editedList?.episodes.findIndex(e => e.id == episode.id && e.siteSection == episode.siteSection);
    }
    editedListChanged() {
        if (this.editedList) {
            this.editedList.hasChanges = true;
        }
    }
    deleteList() {
        if (confirm('Are you sure you want to delete this list?\n\nThis cannot be undone, but entries will still be added to your database')) {
            this.service.deleteList(parseInt(this.data.show.id)).then(response => {
               if (response.data) {
                   location.href = '/' + this.data.siteSection;
               }
            });
        }
    }
    editListSave(addAfterSave: boolean) {
        if (this.editedList) {
            let episodes = this.editedList.episodes.map(e => ({ id: e.id, section: e.siteSection } as EpisodeId))
            this.service.updateList(parseInt(this.data.show.id), element<HTMLInputElement>('editListTitle').value, episodes).then(response => {
                if (response.data) {
                    this.data.show = response.data;
                    element('showName').html(this.data.show.name);
                    this.editListCancel();
                    if (addAfterSave) {
                        this.startAddToListMode();
                    }
                }
            });
        }
    }
    editListCancel() {
        element('content').removeClass('edit-list');
        element<HTMLInputElement>('editListTitle').value = this.data.show.name;
        this.drawEpisodes();
        this.editedList = null;
    }

    addEpisodeToList(event: Event) {
        if (event.target instanceof HTMLElement) {
            event.target.addClass('saving');
            event.target.innerHTML = '';
            let episode = this.data.show.episodes.find(e => e.id.toString() == (event.target as HTMLElement).parentOfClass('episode-row')?.id.slice(11));
            if (episode) {
                window.addToListMode.add([{ id: episode.id, section: episode.siteSection, showId: this.data.show.id }], episodes => {
                    for (let i = 0; i < episodes.length; i++) {
                        let ep = this.data.show.episodes.find(e => e.id == episodes[i].id);
                        if (ep) {
                            element('episode_row' + episodes[i].id).replaceWith(this.episodeRow(ep as tsEpisodeModel, false));
                        }
                    }
                });
            }
        }
    }

    windowResize() {

        let windowHeight = windowSize().h;
        let contentTop = element('page-content').getPosition().top;

        if (elementOrNull('series_list_wrapper')) {
            element('series_list_wrapper').style.height = (windowHeight - contentTop - 2) + 'px';
        }
        element('episode_list').style.height = (windowHeight - contentTop - 2) + 'px';
        element('poster').style.maxHeight = (windowHeight - contentTop - 2) + 'px';

        if (elementOrNull('showSettingsButton')) {
            element('userShow_menu').style.top = (element('showSettingsButton').getPosition().top + element('showSettingsButton').offsetHeight + 2) + 'px';
            element('filter_menu').style.top = (element('showSettingsButton').getPosition().top + element('showSettingsButton').offsetHeight + 2) + 'px';
            element('settings_menu').style.top = (element('showSettingsButton').getPosition().top + element('showSettingsButton').offsetHeight + 2) + 'px';
        }
        
        if (!this.resized && this.activeSeries && this.activeSeries > 3) {
            let activeSeriesButton = firstOfClass('active', element('series_list'));
            if (activeSeriesButton) {   
                activeSeriesButton.scrollIntoView();
                this.resized = true;
            }
        }
    }

}