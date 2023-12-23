import { element, elementOrNull, makeElement } from "../../Scripts/BRLibraries/DOM";
import { windowSize } from "../../Scripts/BRLibraries/WindowSize";
import { EpisodeFileIcon } from "../../Scripts/EpisodeFileIcon";
import { EpisodeObject } from "../../Scripts/EpisodeObject";
import { EpisodeWatchIcon } from "../../Scripts/EpisodeWatchIcon";
import { tsEpisodeId, tsEpisodeModel, tsShowModel, tsShowModelForList } from "../../Scripts/Models/extendedModels";
import { EpisodeId, EpisodeModel, ShowModel, ShowPageModel, ShowSettings, SiteSection } from "../../Scripts/Models/~csharpe-models";
import { MediaLifeService } from "../../Scripts/Services/~csharpe-services";
import { MediaLife } from "../../Scripts/Site";
import '../../Scripts/BRLibraries/Form';


export class HomeShow {

    service = new MediaLifeService.HomeController();

    activeSeries: number | null = null;
    editedList: tsShowModelForList | null = null;

    constructor(private site: MediaLife, private data: ShowPageModel) {

        this.windowResize();

        let lastSeries = this.data.show.nextEpisode ? this.data.show.nextEpisode.seriesNumber : null;
        let maxSeries = Math.max(...this.data.show.episodes.map(e => e.seriesNumber));
        if (!lastSeries) {
            lastSeries = maxSeries;
        }
        this.activeSeries = lastSeries;
        let activeSeriesButton = null;

        if (elementOrNull('series_list')) {
            element('series_list').innerHTML = '';
            if (maxSeries > 999) { element('series_list_wrapper').addClass('wide'); }
            let series = [...new Set(this.data.show.episodes.map(e => e.seriesNumber))].sort((a, b) => a - b);

            element('series_list').appendElement('li').appendElement('a', { html: 'All', href: 'JavaScript:;', events: { click: (e: Event) => this.selectSeries(e) } });
            for (let i = 0; i < series.length; i++) {
                let button = element('series_list')
                    .appendElement('li', { class: series[i] == this.activeSeries ? 'active' : '' })
                    .appendElement('a', { html: series[i].toString(), href: 'JavaScript:;', events: { click: (e: Event) => this.selectSeries(e) } });
                if (series[i] == this.activeSeries) {
                    activeSeriesButton = button;
                }
            }

            if (activeSeriesButton && this.activeSeries > 3) {
                activeSeriesButton.scrollIntoView();
            }
        }

        this.drawEpisodes();
        this.drawPoster();

        if (this.data.show.added) {

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

        element('poster').innerHTML = '';
        element('poster').style.backgroundImage = '';

        if (this.data.show.episodePosters.length == 1) {

            element('poster').style.backgroundImage = "url('" + this.data.show.episodePosters[0] + "')";

        } else if (this.data.show.episodePosters.length > 1) {

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

        element('episode_list').innerHTML = '';
        let episodes = this.data.show.episodes;

        if (this.data.siteSection == SiteSection.TV && this.activeSeries !== null) {
            episodes = this.data.show.episodes.filter(e => e.seriesNumber == this.activeSeries);
        }

        for (let i = 0; i < episodes.length; i++) {
            element('episode_list').appendChild(this.episodeRow(episodes[i] as tsEpisodeModel) as HTMLElement);
        }
        element('episode_list').appendButton('Add to List', { classes: 'button add edit-list-show', click: () => this.startAddToListMode() });
    }

    episodeRow(episode: tsEpisodeModel) {

        let all = this.activeSeries === null;
        let airDate = episode.airDate ? new Date(episode.airDate) : null;
        let available = episode.hasTorrests || episode.filePath;

        let row = elementOrNull('episode_row' + episode.id);
        if (row) {
            row.innerHTML = '';
        } else {
            row = makeElement<HTMLElement>('div', { id: 'episode_row' + episode.id, events: { mouseenter: (e: Event) => this.hoverEpisode(e), mouseleave: () => this.hoverOffEpisode() } });
        }
        row.className = 'episode-row' + ((airDate == null || airDate > new Date()) && !available ? ' future' + (episode.watched ? '-but-watched' : '') : '');

        let name = row.appendElement('div', { class: 'name-and-number' + (all ? ' wide-number' : '') });
        name.appendElement('span', { class: 'number', html: (all ? 'S' + episode.seriesNumber + ': ' : '') + episode.number });
        name.appendElement('span', { class: 'name', html: episode.name });
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

    hoverEpisode(event: Event) {
        if (event.target instanceof HTMLElement) {
            let id = parseInt(event.target.id.slice(11));
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
        element<HTMLInputElement>('addShowButton').disabled = true;
        this.service.addShow(this.data.show.siteSection, this.data.show.id).then(response => {
            if (response.data) {
                element('showName').html(response.data.name);
                element('addShowButton').addClass('hide');
                element('removeShowButton').removeClass('hide');
                element('showSettingsButton').removeClass('hide');
            } else {
                element('addShowButton').removeClass('hide');
            }
            element<HTMLInputElement>('addShowButton').disabled = false;
        });
    }

    removeShow() {
        if (this.data.someEpisodesInList) {
            alert('Cannot remove as some parts are in one or more custom lists');
        } else {
            element<HTMLInputElement>('removeShowButton').disabled = true;
            this.service.removeShow(this.data.show.siteSection, this.data.show.id).then(response => {
                if (response.data) {
                    element('removeShowButton').addClass('hide');
                    element('showSettingsButton').addClass('hide');
                    element('addShowButton').removeClass('hide');
                } else {
                    element('removeShowButton').removeClass('hide');
                }
                element<HTMLInputElement>('removeShowButton').disabled = false;
            });
        }
    }

    toggleSettingsMenu() {
        if (!element('showSettingsButton').containsClass('saving')) {
            let hide = !element('settings_menu').containsClass('hide');
            element('blackout').toggleClassIfTrue('hide', hide);
            element('settings_menu').toggleClassIfTrue('hide', hide);
            element('showSettingsButton').toggleClassIfTrue('open', !hide);
        }
    }

    saveSettings() {

        this.toggleSettingsMenu();
        element('showSettingsButton').addClass('saving');

        let form = element<HTMLFormElement>('settings_menu').toJson<ShowSettings>();
        this.service.saveSettings(this.data.show.siteSection, this.data.show.id, form).then(response => {
            if (form.skipUntilSeries != this.data.show.skipUntilSeries) {
                location.reload();
            } else {
                element('showSettingsButton').removeClass('saving')
            }
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
                if (this.data.show.episodes.filter(e => e.watched != null || e.startedWatching != null).length == 0) {
                    element('removeShowButton').removeClass('hide');
                    element('showSettingsButton').removeClass('hide');
                } else {
                    element('addShowButton').addClass('hide');
                    element('removeShowButton').addClass('hide');
                    element('showSettingsButton').removeClass('hide');
                    this.data.show.added = new Date().formatForJson();
                }
            }
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
                let id = parseInt(row.id.slice(11));
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
                let id = parseInt(row.id.slice(11));
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
                let id = parseInt(row.id.slice(11));
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
            this.service.deleteList(this.data.show.id).then(response => {
               if (response.data) {
                   location.href = '/' + this.data.siteSection;
               }
            });
        }
    }
    editListSave(addAfterSave: boolean) {
        if (this.editedList) {
            let episodes = this.editedList.episodes.map(e => ({ id: e.id, section: e.siteSection } as EpisodeId))
            this.service.updateList(this.data.show.id, element<HTMLInputElement>('editListTitle').value, episodes).then(response => {
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
                            element('episode_row' + episodes[i].id).replaceWith(this.episodeRow(ep as tsEpisodeModel));
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
            element('settings_menu').style.top = (element('showSettingsButton').getPosition().top + element('showSettingsButton').offsetHeight + 2) + 'px';
        }
    }

}