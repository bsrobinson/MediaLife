import { $, $OrNull, makeElement } from "../../Scripts/BRLibraries/DOM";
import { windowSize } from "../../Scripts/BRLibraries/WindowSize";
import { EpisodeFileIcon } from "../../Scripts/EpisodeFileIcon";
import { EpisodeObject } from "../../Scripts/EpisodeObject";
import { EpisodeWatchIcon } from "../../Scripts/EpisodeWatchIcon";
import { tsEpisodeId, tsEpisodeModel, tsShowModel, tsShowModelForList } from "../../Scripts/Models/extendedModels";
import { EpisodeId, EpisodeModel, ShowModel, ShowPageModel, ShowSettings, SiteSection } from "../../Scripts/Models/~csharpe-models";
import { MediaLifeService } from "../../Scripts/Services/~csharpe-services";
import { MediaLife } from "../../Scripts/Site";

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

        if ($OrNull('series_list')) {
            $('series_list').innerHTML = '';
            if (maxSeries > 999) { $('series_list_wrapper').addClass('wide'); }
            let series = [...new Set(this.data.show.episodes.map(e => e.seriesNumber))].sort((a, b) => a - b);

            $('series_list').appendElement('li').appendElement('a', { html: 'All', href: 'JavaScript:;', events: { click: (e: Event) => this.selectSeries(e) } });
            for (let i = 0; i < series.length; i++) {
                let button = $('series_list')
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
                if (response.data && !$('content').containsClass('edit-list')) {
                    this.data.show = response.data;
                    $('showName').innerHTML = this.data.show.name;
                    if ($OrNull('author')) {
                        $('author').innerHTML = this.data.show.showAuthor || '';
                    }
                    this.drawEpisodes();
                    this.drawPoster();
                }
            })
        }
    }

    drawPoster() {

        $('poster').innerHTML = '';
        $('poster').style.backgroundImage = '';

        if (this.data.show.episodePosters.length == 1) {

            $('poster').style.backgroundImage = "url('" + this.data.show.episodePosters[0] + "')";

        } else if (this.data.show.episodePosters.length > 1) {

            for (let i = 0; i < this.data.show.episodePosters.length; i++) {
                $('poster').appendElement('div', { class: 'mini-poster', style: `background-image:url('${this.data.show.episodePosters[i]}')` })
            }

        } else if (this.data.show.poster) {

            $('poster').style.backgroundImage = "url('" + this.data.show.poster + "')";

        } else {

            $('poster').innerHTML = this.data.show.name;

            $('poster').style.fontSize = '';
            let fontSize = 40;
            while ($('poster').scrollHeight > $('poster').clientHeight || $('poster').scrollWidth > $('poster').clientWidth) {
                fontSize--;
                $('poster').style.fontSize = fontSize + 'px';
            }
        }
    }

    selectSeries(event: Event) {

        let seriesButtons = $('series_list').children;
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

        $('episode_list').innerHTML = '';
        let episodes = this.data.show.episodes;

        if (this.data.siteSection == SiteSection.TV && this.activeSeries !== null) {
            episodes = this.data.show.episodes.filter(e => e.seriesNumber == this.activeSeries);
        }

        for (let i = 0; i < episodes.length; i++) {
            $('episode_list').appendChild(this.episodeRow(episodes[i] as tsEpisodeModel));
        }
        $('episode_list').appendElement('input', { type: 'button', value: 'Add to List', class: 'button add edit-list-show', style: 'margin:6px 0 10px 0', events: { click: () => this.startAddToListMode() } });
    }

    episodeRow(episode: tsEpisodeModel) {

        let all = this.activeSeries === null;
        let airDate = episode.airDate ? new Date(episode.airDate) : null;
        let available = episode.hasTorrests || episode.filePath;

        let row = $OrNull('episode_row' + episode.id);
        if (row) {
            row.innerHTML = '';
        } else {
            row = makeElement('div', { id: 'episode_row' + episode.id, events: { mouseenter: (e: Event) => this.hoverEpisode(e), mouseleave: () => this.hoverOffEpisode() } });
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

        icons.appendElement('a', { href: 'JavaScript:;', class: 'icon up edit-list-show', title: 'Move up', events: { click: (e: Event) => this.moveEpisodeUp(e) } });
        icons.appendElement('a', { href: 'JavaScript:;', class: 'icon down edit-list-show', title: 'Move down', events: { click: (e: Event) => this.moveEpisodeDown(e) } });
        icons.appendElement('a', { href: 'JavaScript:;', class: 'icon remove edit-list-show', title: 'Remove', events: { click: (e: Event) => this.removeEpisode(e) } });

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
                $('poster').innerHTML = '';
                $('poster').style.backgroundImage = "url('" + episode.poster + "')";
            }
        }
    }

    hoverOffEpisode() {
        this.drawPoster();
    }

    addShow() {
        $<HTMLInputElement>('addShowButton').disabled = true;
        this.service.addShow(this.data.show.siteSection, this.data.show.id).then(response => {
            if (response.data) {
                $('showName').html(response.data.name);
                $('addShowButton').addClass('hide');
                $('removeShowButton').removeClass('hide');
                $('showSettingsButton').removeClass('hide');
            } else {
                $('addShowButton').removeClass('hide');
            }
            $<HTMLInputElement>('addShowButton').disabled = false;
        });
    }

    removeShow() {
        if (this.data.someEpisodesInList) {
            alert('Cannot remove as some parts are in one or more custom lists');
        } else {
            $<HTMLInputElement>('removeShowButton').disabled = true;
            this.service.removeShow(this.data.show.siteSection, this.data.show.id).then(response => {
                if (response.data) {
                    $('removeShowButton').addClass('hide');
                    $('showSettingsButton').addClass('hide');
                    $('addShowButton').removeClass('hide');
                } else {
                    $('removeShowButton').removeClass('hide');
                }
                $<HTMLInputElement>('removeShowButton').disabled = false;
            });
        }
    }

    toggleSettingsMenu() {
        if (!$('showSettingsButton').containsClass('saving')) {
            let hide = !$('settings_menu').containsClass('hide');
            $('blackout').toggleClassIfTrue('hide', hide);
            $('settings_menu').toggleClassIfTrue('hide', hide);
        }
    }

    saveSettings() {

        this.toggleSettingsMenu();
        $('showSettingsButton').addClass('saving');

        let form = $<HTMLFormElement>('settings_menu').toJson<ShowSettings>();
        this.service.saveSettings(this.data.show.siteSection, this.data.show.id, form).then(response => {
            if (form.skipUntilSeries != this.data.show.skipUntilSeries) {
                location.reload();
            } else {
                $('showSettingsButton').removeClass('saving')
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
                    $('removeShowButton').removeClass('hide');
                    $('showSettingsButton').removeClass('hide');
                } else {
                    $('addShowButton').addClass('hide');
                    $('removeShowButton').addClass('hide');
                    $('showSettingsButton').removeClass('hide');
                    this.data.show.added = new Date().formatForJson();
                }
            }
        }
    }


    editList() {

        $('content').addClass('edit-list');

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
                        $('episode_row' + episode.id).removeElement();
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
            this.service.updateList(this.data.show.id, $<HTMLInputElement>('editListTitle').value, episodes).then(response => {
                if (response.data) {
                    this.data.show = response.data;
                    $('showName').html(this.data.show.name);
                    this.editListCancel();
                    if (addAfterSave) {
                        this.startAddToListMode();
                    }
                }
            });
        }
    }
    editListCancel() {
        $('content').removeClass('edit-list');
        $<HTMLInputElement>('editListTitle').value = this.data.show.name;
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
                            $('episode_row' + episodes[i].id).replaceWith(this.episodeRow(ep as tsEpisodeModel));
                        }
                    }
                });
            }
        }
    }

    windowResize() {

        let windowHeight = windowSize().h;
        let contentTop = $('page-content').getPosition().top;

        if ($OrNull('series_list_wrapper')) {
            $('series_list_wrapper').style.height = (windowHeight - contentTop - 2) + 'px';
        }
        $('episode_list').style.height = (windowHeight - contentTop - 2) + 'px';
        $('poster').style.maxHeight = (windowHeight - contentTop - 2) + 'px';

        if ($OrNull('showSettingsButton')) {
            $('settings_menu').style.top = ($('showSettingsButton').getPosition().top + $('showSettingsButton').offsetHeight + 2) + 'px';
        }
    }

}