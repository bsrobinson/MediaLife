﻿import { MediaLife } from '../../Scripts/Site'
import { element, elementOrNull, makeElement } from '../../Scripts/BRLibraries/DOM'
import { PageType, SiteSection } from '../../Scripts/Models/~csharpe-models';
import { MediaLifeService } from '../../Scripts/Services/~csharpe-services';
import { tsEpisodeId, tsEpisodeModel, tsListPageModel, tsShowModel } from '../../Scripts/Models/extendedModels';
import { EpisodeObject } from '../../Scripts/EpisodeObject';
import { EpisodeFileIcon } from '../../Scripts/EpisodeFileIcon';
import { EpisodeWatchIcon } from '../../Scripts/EpisodeWatchIcon';
import '../../Scripts/BRLibraries/Form'

export class HomeIndex {

    service = new MediaLifeService.HomeController();

    showLists: {
        watching: tsShowModel[],
        notWatchedRecently: tsShowModel[],
        notStarted: tsShowModel[],
        allShows: tsShowModel[],
    } = { watching: [], notWatchedRecently: [], notStarted: [], allShows: [] };

    allShowsLoaded = false

    constructor(private site: MediaLife, private data: tsListPageModel) {
    }

    init() {
        if (this.data.context.pageType == PageType.Search) {
            this.addShowsToLists(this.data.shows);
            this.showAllShows();
        }
        else {
            this.addShowsToLists([
                { id: '0', skellington: true, started: true, watchedRecently: true },
                { id: '1', skellington: true, started: true, watchedRecently: true },
                { id: '2', skellington: true, started: true, watchedRecently: true },
                { id: '3', skellington: true, started: true, watchedRecently: true },
                { id: '4', skellington: true, started: true, watchedRecently: true },
                { id: '5', skellington: true },
                { id: '6', skellington: true },
                { id: '7', skellington: true },
                { id: '8', skellington: true },
                { id: '9', skellington: true },
            ] as tsShowModel[]);

            this.service.watching(this.data.context.siteSection).then(response => {
                if (response.data) {
                    this.data.shows = this.data.shows.filter(s => s.skellington && !s.started);
                    this.showLists.watching = [];
                    this.showLists.allShows = [];
                    this.addShowsToLists(response.data as tsShowModel[]);

                    this.service.notStarted(this.data.context.siteSection).then(response => {
                        if (response.data) {
                            this.data.shows = this.data.shows.filter(s => !s.skellington);
                            this.showLists.notStarted = [];
                            this.showLists.allShows = [];
                            this.addShowsToLists(response.data as tsShowModel[]);

                            this.service.allShows(this.data.context.siteSection).then(response => {
                                if (response.data) {
                                    this.allShowsLoaded = true
                                    this.addShowsToLists(response.data as tsShowModel[]);
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    addShowsToLists(shows: tsShowModel[]) {
        
        if (!this.data.shows) { this.data.shows = []; }
        this.data.shows = this.data.shows.concat(shows.filter(s => this.data.shows.find(m => m.id == s.id) == null));

        this.updateShowLists()
        this.updateWatchingWithMenu()
    }

    changeWatchingWith() {
        let value = element<HTMLSelectElement>('watchingWithSelect').value
        if (value == '') {
            localStorage.removeItem('watching-with')
        } else {
            localStorage.setItem('watching-with', element<HTMLSelectElement>('watchingWithSelect').value);
        }
        this.updateShowLists()
    }

    updateShowLists() {

        this.showLists = { watching: [], notWatchedRecently: [], notStarted: [], allShows: [] };

        this.data.shows.forEach(show => {

            let watchingWithIds = localStorage.getItem('watching-with') ?? '';
            
            if (this.data.context.pageType == PageType.Search || show.skellington || watchingWithIds == '' || show.users.map(u => u.id).sort().join(',') == watchingWithIds) {

                if (this.showLists.watching.find(s => s.id == show.id) == null && show.started && !show.userComplete && show.watchedRecently) {
                    this.showLists.watching.push(show);
                }
                else if (this.showLists.notWatchedRecently.find(s => s.id == show.id) == null && show.started && !show.userComplete && !show.watchedRecently) {
                    this.showLists.notWatchedRecently.push(show);
                }
                else if (this.showLists.notStarted.find(s => s.id == show.id) == null && (!show.startedAiring || (!show.started && !show.userComplete))) {
                    this.showLists.notStarted.push(show);
                }
                if (this.showLists.allShows.find(s => s.id == show.id) == null) {
                    this.showLists.allShows.push(show);
                }

            }
        });
        this.sortWatching();
        this.sortNotWatchedRecently();
        this.sortNotStarted();

        if (this.showLists.watching.length == 0 && this.showLists.notWatchedRecently.length == 0 && this.showLists.notStarted.length == 0) {
            this.showAllShows();
        } else {
            if (elementOrNull('watching_header')) { element('watching_header').style.display = this.showLists.watching.length == 0 ? 'none' : 'flex'; }
            if (elementOrNull('notWatchedRecently_header')) { element('notWatchedRecently_header').style.display = this.showLists.notWatchedRecently.length == 0 ? 'none' : 'flex'; }
            if (elementOrNull('notStarted_header')) { element('notStarted_header').style.display = this.showLists.notStarted.length == 0 ? 'none' : 'flex'; }
            if (elementOrNull('default_sections')) { element('default_sections').removeClass('hide'); }
        }
    }

    updateWatchingWithMenu() {

        let watchingWithIds = localStorage.getItem('watching-with') ?? '';
        let watchingWithIdsInMenu = watchingWithIds == ''

        let watchingWithOptions: HTMLOptionElement[] = [
            new Option('All shows', '')
        ]

        let showUsers = this.data.shows.filter(s => !s.skellington).map(s => s.users)
        if (showUsers.length > 0) {

            let myId = showUsers[0].find(u => u.me)?.id
            if (myId) {

                watchingWithOptions.push(new Option('Watching alone', myId.toString()))
                if (watchingWithIds == myId.toString()) { watchingWithIdsInMenu = true }

                showUsers.forEach(s => {
                    let names = s.filter(u => !u.me).map(u => u.name).join(', ').replace(new RegExp(', ([^,]*)$'), ' & $1');
                    let value = s.map(u => u.id).sort().join(',')
                    if (names != '' && !watchingWithOptions.some(o => o.value == value)) {
                        watchingWithOptions.push(new Option('Watching with ' + names, value))
                        if (watchingWithIds == value) { watchingWithIdsInMenu = true }
                    }
                })
            }
        }

        let watchingWithSelect = element<HTMLSelectElement>('watchingWithSelect')
        
        watchingWithSelect.empty()
        watchingWithOptions.forEach(o => watchingWithSelect.add(o))

        element('formfieldrow_watchingWithSelect').toggleClassIfTrue('hide', watchingWithOptions.length <= 2)
        
        if (watchingWithIdsInMenu) {
            watchingWithSelect.setValue(watchingWithIds, false)
        } else if (this.allShowsLoaded) {
            localStorage.removeItem('watching-with')
            location.reload()
        }
    }

    sortWatching() { this.sortList('watching'); }
    sortNotWatchedRecently() { this.sortList('notWatchedRecently'); }
    sortNotStarted() { this.sortList('notStarted'); }
    sortAllShows() { this.sortList('allShows'); }

    sortList(list: ('watching' | 'notWatchedRecently' | 'notStarted' | 'allShows')) {

        let sortSelect = elementOrNull<HTMLSelectElement>(list + '_sort_select');
        if (sortSelect) {
            let option = sortSelect.options[sortSelect.selectedIndex];
            let order = option.value;

            let decending = order.slice(0, 5) == 'desc_';
            if (decending) { order = order.slice(5); }

            let headers = order.slice(0, 6) == 'group_';
            if (headers) { order = order.slice(6); }

            this.showLists[list].sort((a, b) => {
                let sortA = a[order]?.toString() || (decending ? '0' : 'zzz');
                if (typeof sortA == 'string') { sortA = sortA.toLowerCase(); }
                let sortB = b[order]?.toString() || (decending ? '0' : 'zzz');
                if (typeof sortB == 'string') { sortB = sortB.toLowerCase(); }
                return decending ? (sortA < sortB ? 1 : -1) : (sortA > sortB ? 1 : -1);
            });

            element(list + '_posters').innerHTML = '';
            let previousValue = '';
            for (let i = 0; i < this.showLists[list].length; i++) {
                if (headers && previousValue != this.showLists[list][i][order]) {
                    element(list + '_posters').appendElement('div', { class: 'sort-header', html: this.showLists[list][i][order] });
                }
                this.addPoster(list + '_posters', this.showLists[list][i]);
                previousValue = this.showLists[list][i][order];
            }
        }
    }

    addPoster(toElement: string, show: tsShowModel) {

        let poster;

        if (show.skellington) {

            poster = element(toElement).appendElement('div', { class: 'poster skellington' });
            poster.appendElement('a');
            poster.appendElement('div', { class: 'name', html: '&nbsp;' });
            poster.appendElement('div', { class: 'episode-row', html: '&nbsp;' });

        } else {

            poster = element(toElement).appendElement('div', { id: 'show_' + show.id, class: 'poster' });
            let image = poster.appendElement('a', { href: 'JavaScript:;', events: { click: () => { location.href =  `/${show.isList ? 'lists' : this.data.context.siteSection}/${show.id}`; } } });
            poster.appendElement('div', { class: 'name', html: this.data.context.siteSection != SiteSection.TV ? show.posterName : show.name });
            poster.appendChild(this.episodeRow(show));

            if (show.episodePosters.length == 1 && show.siteSection == SiteSection.Movies) {

                image.style.backgroundImage = "url('" + show.episodePosters[0] + "')";

            } else if (show.episodePosters.length > 1 && show.siteSection == SiteSection.Movies) {

                for (let i = 0; i < show.episodePosters.length; i++) {
                    image.appendElement('div', { class: 'mini-poster', style: `background-image:url('${show.episodePosters[i]}')` })
                }

            } else if (show.poster) {

                image.style.backgroundImage = "url('" + show.poster + "')";

            } else {

                image.innerHTML = show.name

                // fit text, where there is no poster
                setTimeout(() => {
                    let fontSize = 40;
                    while (image.scrollHeight > image.clientHeight || image.scrollWidth > image.clientWidth) {
                        fontSize--;
                        image.style.fontSize = fontSize + 'px';
                    }
                });
            }
        }
        
        if (this.data.context.siteSection == SiteSection.YouTube) {
            poster.addClass('round');
        }
    }

    episodeRow(show: tsShowModel) {

        let row = makeElement('div', { id: 'episode_row_for_show_' + show.id, class: 'episode-row' });

        let episodeContent = row.appendElement('span', { class: 'add-to-list-hide' });
        let ep = show.nextEpisode as tsEpisodeModel;
        if (show.userUnwatchedCount == 0) {
            if (show.startedAiring) {
                episodeContent.appendIcon('check', { label: 'All ' + (this.data.context.siteSection == SiteSection.Books ? 'read' : 'watched') });
            } else if (show.firstAirDate != null) {
                episodeContent.appendElement('span', { html: (this.data.context.siteSection == SiteSection.TV ? 'Starts ' : 'Released ') + new Date(show.firstAirDate).format('j M Y') });
            }
        } else {

            if (!ep.obj) {
                ep.obj = new EpisodeObject(show, ep);
            }
            episodeContent.appendChild(new EpisodeFileIcon(ep.obj, 'search-page').node);
            episodeContent.appendChild(new EpisodeWatchIcon(ep.obj, 'search-page').node);
            episodeContent.appendElement('span', { html: this.data.context.siteSection == SiteSection.TV ? ep.seriesEpisodeNumber + ' &#8211; ' + ep.name : ep.name });
            if (show.episodeAfterNext) {
                new EpisodeFileIcon(new EpisodeObject(show, show.episodeAfterNext as tsEpisodeModel));
                new EpisodeWatchIcon(new EpisodeObject(show, show.episodeAfterNext as tsEpisodeModel));
            }

            row.appendElement('div', { class: 'episode-count', html: show.userUnwatchedCount.toString() });
        }

        let addToListContent = row.appendElement('span', { class: 'add-to-list-show' });
        if (window.addToListMode.containsAll(show.episodeIds as tsEpisodeId[])) {
            addToListContent.appendIcon('check', { label: 'In List' });
        } else {
            addToListContent.appendIcon('plus', { label: `Add ${show.episodeCount > 1 ? 'All ' + show.episodeCount : ''} to list`, class: 'poster-icon add-to-list', click: (e: Event) => this.addEpisodesToList(e) });
        }

        return row;
    }

    updateEpisodeRow(show: tsShowModel | undefined, fadeChange: boolean = false) {

        if (show) {
            let row = element('episode_row_for_show_' + show.id);
            let episodeContent = row.children[0] as HTMLElement;
            episodeContent.style.opacity = fadeChange ? '0' : '1';
            
            setTimeout(() => {
                row.replaceWith(this.episodeRow(show));
                episodeContent.style.opacity = '1';
            }, fadeChange ? 500 : 0);
        }
    }

    episodeUpdated(episodeObj: EpisodeObject) {
        this.updateEpisodeRow(episodeObj.show, episodeObj.show.nextEpisode?.id != episodeObj.episode.id);
    }


    addEpisodesToList(event: Event) {
        if (event.target instanceof HTMLElement) {

            let parent = event.target.parentOfClass('add-to-list-show');
            if (parent) {
                    
                parent.html('');
                parent.appendIcon('ellipsis');
                
                let showId = event.target.parentOfClass('poster')?.id.slice(5);
                if (showId) {
                    let episodeIds = this.data.shows.find(s => s.id == showId)?.episodeIds as tsEpisodeId[];
                    if (episodeIds && episodeIds.length > 0) {
                        
                        episodeIds[0].showId = showId;                
                        
                        window.addToListMode.add(episodeIds, episodes => {
                            this.updateEpisodeRow(this.data.shows.find(s => s.id == episodes[0].showId));
                        });
                    }
                }
            }
        }
    }

    showAllShows() {
        element('default_sections').innerHTML = '';
        element('all_shows').removeClass('hide');
        this.sortAllShows();
        document.body.scrollTop = 0;

        if (this.data.shows.length == 0) {
            element('allShows_posters').addClass('empty');
            element('allShows_posters').html(this.data.context.pageType == PageType.Search ? 'No results found.' : 'You have no shows added.')
        }
    }
    
}