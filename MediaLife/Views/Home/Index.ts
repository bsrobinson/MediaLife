﻿import { MediaLife } from '../../Scripts/Site'
import { $, makeElement } from '../../Scripts/BRLibraries/DOM'
import { PageType, SiteSection } from '../../Scripts/Models/~csharpe-models';
import { MedialifeService } from '../../Scripts/Services/~csharpe-services';
import { tsEpisodeId, tsEpisodeModel, tsListPageModel, tsShowModel } from '../../Scripts/Models/extendedModels';
import { EpisodeObject } from '../../Scripts/EpisodeObject';
import { EpisodeFileIcon } from '../../Scripts/EpisodeFileIcon';
import { EpisodeWatchIcon } from '../../Scripts/EpisodeWatchIcon';

export class HomeIndex {

    service = new MedialifeService.HomeController();

    showLists: {
        watching: tsShowModel[],
        notWatchedRecently: tsShowModel[],
        notStarted: tsShowModel[],
        allShows: tsShowModel[],
    } = { watching: [], notWatchedRecently: [], notStarted: [], allShows: [] };

    constructor(private site: MediaLife, private data: tsListPageModel) {

        if (this.data.context.pageType == PageType.Search) {
            this.addShowsToLists(this.data.shows);
            this.showAllShows();
        }
        else {
            this.addShowsToLists([
                { id: 0, skellington: true, started: true, watchedRecently: true },
                { id: 1, skellington: true, started: true, watchedRecently: true },
                { id: 2, skellington: true, started: true, watchedRecently: true },
                { id: 3, skellington: true, started: true, watchedRecently: true },
                { id: 4, skellington: true, started: true, watchedRecently: true },
                { id: 5, skellington: true },
                { id: 6, skellington: true },
                { id: 7, skellington: true },
                { id: 8, skellington: true },
                { id: 9, skellington: true },
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

        shows.forEach(show => {
            if (this.showLists.watching.find(s => s.id == show.id) == null && show.started && !show.complete && show.watchedRecently) {
                this.showLists.watching.push(show);
            }
            else if (this.showLists.notWatchedRecently.find(s => s.id == show.id) == null && show.started && !show.complete && !show.watchedRecently) {
                this.showLists.notWatchedRecently.push(show);
            }
            else if (this.showLists.notStarted.find(s => s.id == show.id) == null && (!show.startedAiring || (!show.started && !show.complete))) {
                this.showLists.notStarted.push(show);
            }
            if (this.showLists.allShows.find(s => s.id == show.id) == null) {
                this.showLists.allShows.push(show);
            }
        });
        this.sortWatching();
        this.sortNotWatchedRecently();
        this.sortNotStarted();

        if (this.showLists.watching.length == 0 && this.showLists.notWatchedRecently.length == 0 && this.showLists.notStarted.length == 0) {
            this.showAllShows();
        } else {
            $('watching_header').style.display = this.showLists.watching.length == 0 ? 'none' : 'flex';
            $('notWatchedRecently_header').style.display = this.showLists.notWatchedRecently.length == 0 ? 'none' : 'flex';
            $('notStarted_header').style.display = this.showLists.notStarted.length == 0 ? 'none' : 'flex';
            $('default_sections').removeClass('hide');
        }
    }

    sortWatching() { this.sortList('watching'); }
    sortNotWatchedRecently() { this.sortList('notWatchedRecently'); }
    sortNotStarted() { this.sortList('notStarted'); }
    sortAllShows() { this.sortList('allShows'); }

    sortList(list: ('watching' | 'notWatchedRecently' | 'notStarted' | 'allShows')) {

        let sortSelect = $<HTMLSelectElement>(list + '_sort_select');
        let option = sortSelect.options[sortSelect.selectedIndex];
        let order = option.value;
        let decending = option.getAttribute('data-direction') == 'desc';
        let headers = option.getAttribute('data-group-headers') == 'true';

        this.showLists[list].sort((a, b) => {
            let sortA = a[order]?.toString() || (decending ? '0' : 'zzz');
            if (typeof sortA == 'string') { sortA = sortA.toLowerCase(); }
            let sortB = b[order]?.toString() || (decending ? '0' : 'zzz');
            if (typeof sortB == 'string') { sortB = sortB.toLowerCase(); }
            return decending ? (sortA < sortB ? 1 : -1) : (sortA > sortB ? 1 : -1);
        });

        $(list + '_posters').innerHTML = '';
        let previousValue = '';
        for (let i = 0; i < this.showLists[list].length; i++) {
            if (headers && previousValue != this.showLists[list][i][order]) {
                $(list + '_posters').appendElement('div', { class: 'sort-header', html: this.showLists[list][i][order] });
            }
            this.addPoster(list + '_posters', this.showLists[list][i]);
            previousValue = this.showLists[list][i][order];
        }

        $(list + '_sort_button_label').innerHTML = option.text

    }

    addPoster(toElement: string, show: tsShowModel) {

        if (show.skellington) {

            let poster = $(toElement).appendElement('div', { class: 'poster skellington' });
            poster.appendElement('a');
            poster.appendElement('div', { class: 'name', html: '&nbsp;' });
            poster.appendElement('div', { class: 'episode-row', html: '&nbsp;' });

        } else {

            let poster = $(toElement).appendElement('div', { id: 'show_' + show.id, class: 'poster' });
            let image = poster.appendElement('a', { href: `/${show.isList ? 'lists' : this.data.context.siteSection}/${show.id}` });
            poster.appendElement('div', { class: 'name', html: this.data.context.siteSection != SiteSection.TV ? show.posterName : show.name });
            poster.appendChild(this.episodeRow(show));

            if (show.episodePosters.length == 1) {

                image.style.backgroundImage = "url('" + show.episodePosters[0] + "')";

            } else if (show.episodePosters.length > 1) {

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
    }

    episodeRow(show: tsShowModel) {

        let row = makeElement('div', { id: 'episode_row_for_show_' + show.id, class: 'episode-row' });

        let episodeContent = row.appendElement('span', { class: 'add-to-list-hide' });
        let ep = show.nextEpisode as tsEpisodeModel;
        if (show.unwatchedCount == 0) {
            if (show.startedAiring) {
                episodeContent.appendElement('img', { src: '/images/tick.svg' });
                episodeContent.appendElement('span', { html: 'All ' + (this.data.context.siteSection == SiteSection.Books ? 'read' : 'watched') });
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

            row.appendElement('div', { class: 'episode-count', html: show.unwatchedCount.toString() });
        }

        let addToListContent = row.appendElement('span', { class: 'add-to-list-show' });
        if (window.addToListMode.containsAll(show.episodeIds as tsEpisodeId[])) {
            addToListContent.appendElement('img', { src: '/images/tick.svg' });
            addToListContent.appendElement('span', { html: 'In List' });
        } else {
            addToListContent.appendElement('span', { html: `Add ${show.episodeCount > 1 ? 'All ' + show.episodeCount : ''} to list`, class: 'poster-icon add-to-list', events: { click: (e: Event) => this.addEpisodesToList(e) } });
        }

        return row;
    }

    updateEpisodeRow(show: tsShowModel | undefined, fadeChange: boolean = false) {

        if (show) {
            let row = $('episode_row_for_show_' + show.id);
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

            event.target.addClass('saving');
            event.target.innerHTML = '';
            
            let showIdString = event.target.parentOfClass('poster')?.id.slice(5);
            if (showIdString) {
                let showId = parseInt(showIdString);
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

    showAllShows() {
        $('default_sections').innerHTML = '';
        $('all_shows').removeClass('hide');
        this.sortAllShows();
        document.body.scrollTop = 0
    }
    
}