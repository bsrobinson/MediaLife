using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using MediaLife.DataProviders;
using MediaLife.Library.DAL;
using MediaLife.Library.Models;
using MediaLife.Models;

namespace MediaLife.Services
{
    public class ShowsService
    {
        private MySqlContext db;
        private Guid SessionId;
        
        public ShowsService(MySqlContext context, Guid? sessionId = null)
        {
            db = context;
            SessionId = sessionId ?? Guid.NewGuid();
        }

        public void HousekeepLogs(int days)
        {
            db.Log(SessionId, "Housekeeping Logs");
            var cutoff = DateTime.Now.Subtract(new TimeSpan(days, 0, 0, 0));
            db.Log.RemoveRange(db.Log.Where(l => l.Timestamp < cutoff));
            db.SaveChanges();
        }

        public string? PirateBayIssue()
        {
            PirateBay? piratebay = db.Piratebay.FirstOrDefault(p => p.Active);
            if (piratebay == null)
            {
                return "There is no active Pirate Bay url";
            }
            else
            {
                if (piratebay.LastSuccess < DateTime.Now.AddDays(-1))
                {
                    return "Last Pirate Bay success was more than a day ago";
                }
            }
            return null;
        }

        public string? ShowUpdateIssue()
        {
            string? issue = null;

            if (issue == null)
            {
                Log? lastSession = db.Log.OrderByDescending(l => l.Id).Take(1).SingleOrDefault();
                if (lastSession != null)
                {
                    Log? error = db.Log.FirstOrDefault(l => l.SessionId == lastSession.SessionId && l.Error);
                    if (error != null)
                    {
                        issue = error.Message;
                    }
                }
            }
            if (issue == null)
            {
                int showUpdatesIn24Hours = db.Shows.Count(s => s.Updated > DateTime.Now.AddHours(-24));
                if (showUpdatesIn24Hours < 30)
                {
                    issue = $"Auto update of the show database may be failing, {(showUpdatesIn24Hours == 0 ? "no" : "only " + showUpdatesIn24Hours)} update{(showUpdatesIn24Hours != 1 ? "s" : "")} in the last 24 hours";
                }
            }

            return issue;
        }

        public ShowModel? GetShow(SiteSection section, uint showId)
        {
            Show? show = null;
            List<EpisodeModel>? episodes = null;

            if (section == SiteSection.Lists)
            {
                List? list = db.Lists.SingleOrDefault(l => l.ListId == showId);
                if (list != null)
                {
                    show = new() { ShowId = showId, Name = list.Name, Added = list.Created };
                    episodes = (
                        from e in db.Episodes
                        join l in db.ListEntries on new { e.EpisodeId, e.SiteSection } equals new { l.EpisodeId, l.SiteSection }
                        where l.ListId == showId
                        select new EpisodeModel(e)
                        {
                            Number = l.Rank,
                            Torrents = (
                                from t in db.Torrents
                                where t.EpisodeId == e.EpisodeId && t.SiteSection == e.SiteSection
                                select t
                            ).ToList()
                        }
                    ).ToList();
                }
            }
            else
            {
                if (section == SiteSection.Movies || section == SiteSection.Books)
                {
                    //Movie and Book collection/show ids are taken from one of their episodes (movies/books),
                    //  so irrespective of which movie/book is requested, select and return the stored collection/show
                    var movieEpisode = db.Episodes.SingleOrDefault(e => e.EpisodeId == showId && e.SiteSection == section);
                    if (movieEpisode != null)
                    {
                        showId = movieEpisode.ShowId;
                    }
                    else { return null; }
                }
                else if (section != SiteSection.TV) { throw new NotImplementedException(); }

                show = db.Shows.SingleOrDefault(s => s.ShowId == showId && s.SiteSection == section);
                episodes = (
                    from e in db.Episodes
                    where e.ShowId == showId && e.SiteSection == section
                    orderby e.AirDate ?? DateTime.MaxValue, e.Number
                    select new EpisodeModel(e)
                    {
                        Torrents = (
                            from t in db.Torrents
                            where t.EpisodeId == e.EpisodeId && t.SiteSection == e.SiteSection
                            select t
                        ).ToList()
                    }
                ).ToList();

                var listsWithTheseEpisodes = (
                    from l in db.Lists
                    join entry in db.ListEntries on l.ListId equals entry.ListId
                    where entry.SiteSection == section && episodes.Select(e => e.Id).Contains(entry.EpisodeId)
                    select new { l, entry }
                ).ToList();

                if (listsWithTheseEpisodes.Count > 0)
                {
                    foreach (EpisodeModel episode in episodes)
                    {
                        episode.InLists = listsWithTheseEpisodes.Where(l => l.entry.EpisodeId == episode.Id).Select(l => l.l).ToList();
                    }
                }
            }

            if (show != null && episodes != null)
            {
                return new ShowModel(show, db.TVNetworks.SingleOrDefault(n => n.NetworkId == show.NetworkId))
                {
                    Episodes = episodes
                };
            }
            return null;
        }

        public async Task<ShowModel?> GetShowFromProviderAsync(SiteSection section, uint showId)
        {
            if (section == SiteSection.TV)
            {
                return await new TVMaze(db).GetShowAsync(showId);
            }
            if (section == SiteSection.Movies)
            {
                return await new TheMovieDB(db).GetMovieAsync(showId);
            }
            if (section == SiteSection.Books)
            {
                return await new Goodreads(db).GetBookAsync(showId);
            }
            throw new NotImplementedException();
        }

        public async Task<uint> GetShowIdFromEpisodeFromProviderAsync(SiteSection section, uint episodeId)
        {
            if (section == SiteSection.TV)
            {
                return (uint)(await new TVMaze(db).GetShowIdFromEpisode((int)episodeId) ?? 0);
            }
            if (section == SiteSection.Movies || section == SiteSection.Books)
            {
                return episodeId;
            }
            throw new NotImplementedException();
        }

        public ShowModel? GetShowForFileName(string filename)
        {
            Episode? episode = db.Episodes.FirstOrDefault(e => e.FilePath != null && e.FilePath.EndsWith(filename));
            if (episode != null)
            {
                ShowModel? show = GetShow((SiteSection)episode.SiteSection, episode.ShowId);
                if (show != null)
                {
                    show.EpisodeIndex = show.Episodes.FindIndex(e => e.Id == episode.EpisodeId);
                }
                return show;
            }
            return null;
        }

        public EpisodeModel? GetEpisode(SiteSection section, uint episodeId)
        {
            Episode? episode = db.Episodes.FirstOrDefault(e => e.EpisodeId == episodeId && e.SiteSection == section);
            if (episode != null)
            {
                return new EpisodeModel(episode, Torrents(section, episodeId));
            }
            return null;
        }

        public List<Torrent> Torrents(SiteSection section, uint episodeId)
        {
            return db.Torrents.Where(t => t.EpisodeId == episodeId && t.SiteSection == section).ToList();
        }

        public List<string> Recommenders()
        {
            List<string> names = db.Shows.Where(s => s.RecommendedBy != null).Select(s => s.RecommendedBy!).Distinct().ToList();
            names.Sort();
            return names;
        }

        public bool SomeEpisodesInList(ShowModel show)
        {
            return db.ListEntries.Where(l => show.Episodes.Select(e => e.Id).Contains(l.EpisodeId)).Count() > 0;
        }

        public bool AddShow(SiteSection section, uint showId)
        {
            Show? dbShow = db.Shows.SingleOrDefault(s => s.ShowId == showId);
            if (dbShow == null)
            {
                ShowModel? showModel = GetShowFromProviderAsync(section, showId).Result;
                
                if (showModel != null)
                {
                    bool deleteWatched = false;
                    ConfigService configSrv = new(db);
                    if (section == SiteSection.TV) { deleteWatched = configSrv.GetBool("DefaultDeleteTV"); }
                    if (section == SiteSection.Movies) { deleteWatched = configSrv.GetBool("DefaultDeleteMovies"); }

                    dbShow = new Show
                    {
                        ShowId = showId,
                        SiteSection = section,
                        Name = showModel.Name,
                        Poster = showModel.Poster,
                        NetworkId = showModel.Network?.NetworkId,
                        Added = DateTime.Now,
                        Updated = DateTime.Now,
                        DeleteWatched = deleteWatched,
                        WatchFromNextPlayable = false,
                        DownloadAllTogether = false,
                        DownloadLimit = section == SiteSection.TV ? configSrv.GetIntOrNull("DefaultTVDownloadLimit") : null,
                    };
                    db.Shows.Add(dbShow);

                    foreach (EpisodeModel episode in showModel.Episodes)
                    {
                        db.Episodes.Add(episode.DBEpisode(section, showId));
                    }
                    db.SaveChanges();

                    return true;
                }
            }
            return false;
        }

        public bool RemoveShow(SiteSection section, uint showId)
        {
            Show? dbShow = db.Shows.SingleOrDefault(s => s.ShowId == showId && s.SiteSection == section);
            if (dbShow != null)
            {
                List<Episode> episodes = db.Episodes.Where(e => e.ShowId == showId && e.SiteSection == section).ToList();
                if (episodes.Count(e => e.Watched != null) == 0)
                {
                    if (db.ListEntries.Where(l => episodes.Select(e => e.EpisodeId).Contains(l.EpisodeId)).Count() == 0)
                    {
                        db.Episodes.RemoveRange(episodes);
                        db.Shows.Remove(dbShow);
                        db.SaveChanges();

                        return true;
                    }
                }
            }
            return false;
        }

        public async Task<bool> UpdateLastUpdatedAsync()
        {
            foreach (SiteSection section in Enum.GetValues(typeof(SiteSection)))
            {
                ConfigService configSrv = new(db);
                if (configSrv.GetBool("Update" + section.ToString()))
                {
                    Show? show = db.Shows.OrderBy(s => s.Updated).FirstOrDefault(s => s.SiteSection == section);
                    if (show != null)
                    {
                        db.Log(SessionId, "Updating for " + section.ToString() + " - " + show.Name);
                        string? updateErrorMessage = await UpdateShowAsync((SiteSection)show.SiteSection, show.ShowId);
                        if (updateErrorMessage != null)
                        {
                            db.Log(SessionId, "Update for " + section.ToString() + " failed - " + updateErrorMessage, true);
                        }
                    }
                }
            }
            return true;
        }

        public async Task<string?> UpdateShowAsync(SiteSection section, uint showId)
        {
            if (section == SiteSection.Lists)
            {
                return UpdateList(showId) ? null : "Failed to update list";
            }
            
            Show? dbShow = db.Shows.SingleOrDefault(s => s.ShowId == showId && s.SiteSection == section);
            if (dbShow != null)
            {
                ShowModel? showModel = await GetShowFromProviderAsync(section, showId);

                if (showModel != null)
                {
                    List<Episode> dbEpisodes = db.Episodes.Where(e => e.ShowId == showId && e.SiteSection == section).ToList();

                    //Remove episodes not in feed
                    List<Episode> episodesToDelete = new List<Episode>();
                    foreach (Episode episode in dbEpisodes)
                    {
                        if (episode.Watched == null && showModel.Episodes.SingleOrDefault(e => e.Id == episode.EpisodeId && e.SiteSection == section) == null)
                        {
                            episodesToDelete.Add(episode);
                        }
                    }
                    db.Episodes.RemoveRange(episodesToDelete);

                    //Update show from feed
                    if (showModel.Name != null && dbShow.Name != showModel.Name) { dbShow.Name = showModel.Name; }
                    if (showModel.Poster != null && dbShow.Poster != showModel.Poster) { dbShow.Poster = showModel.Poster; }
                    if (showModel.Network != null && dbShow.NetworkId != showModel.Network?.NetworkId) { dbShow.NetworkId = showModel.Network?.NetworkId; }

                    //Update episodes and add missing
                    foreach (EpisodeModel episode in showModel.Episodes)
                    {
                        Episode? dbEpisode = db.Episodes.SingleOrDefault(e => e.EpisodeId == episode.Id && e.SiteSection == section);
                        if (dbEpisode == null)
                        {
                            db.Episodes.Add(episode.DBEpisode(section, showId));
                        }
                        else
                        {
                            if (dbEpisode.SeriesNumber != episode.SeriesNumber) { dbEpisode.SeriesNumber = episode.SeriesNumber; }
                            if (dbEpisode.Number != episode.Number) { dbEpisode.Number = episode.Number; }
                            if (episode.Name != null && dbEpisode.Name != episode.Name) { dbEpisode.Name = episode.Name; }
                            if (episode.AirDate != null && dbEpisode.AirDate != episode.AirDate) { dbEpisode.AirDate = episode.AirDate; }
                            if (episode.Poster != null && dbEpisode.Poster != episode.Poster) { dbEpisode.Poster = episode.Poster; }
                            if (episode.Certificate != null && dbEpisode.Certificate != episode.Certificate) { dbEpisode.Certificate = episode.Certificate; }
                            if (episode.Author != null && dbEpisode.Author != episode.Author) { dbEpisode.Author = episode.Author; }
                        }
                    }

                    dbShow.Updated = DateTime.Now;
                    db.SaveChanges();

                    return null;
                }
                return "Provider failed to return show";
            }
            return "Cannot find show in database";
        }

        public bool UpdateList(uint listId)
        {
            List<string> results = new();
            foreach (ListEntry entry in db.ListEntries.Where(e => e.ListId == listId).ToList())
            {
                uint showId = db.Episodes.Single(e => e.EpisodeId == entry.EpisodeId && entry.SiteSection == entry.SiteSection).ShowId;
                string? result = UpdateShowAsync((SiteSection)entry.SiteSection, showId).Result;
                if (result != null)
                {
                    results.Add(result);
                }
            }
            return results.All(t => t == null);
        }

        public Show? UpdateSettings(SiteSection section, uint showId, ShowSettings model)
        {
            Show? show = db.Shows.SingleOrDefault(s => s.ShowId == showId && s.SiteSection == section);
            if (show != null)
            {
                show.RecommendedBy = model.RecommendedBy;
                show.DeleteWatched = model.DeleteWatched;
                show.WatchFromNextPlayable = model.WatchFromNextPlayable;
                show.DownloadAllTogether = model.DownloadAllTogether;
                show.DownloadLimit = model.DownloadLimit;
                db.SaveChanges();

                //Set Skip
                ShowModel? showModel = GetShow(section, showId);
                if (showModel != null && showModel.SkipUntilSeries != model.SkipUntilSeries)
                {
                    bool newSkipValue = true;
                    foreach (EpisodeModel episode in showModel.Episodes.Where(e => e.SeriesNumber < new[] { showModel.SkipUntilSeries, model.SkipUntilSeries }.Max()))
                    {
                        if (episode.SeriesNumber == model.SkipUntilSeries)
                        {
                            newSkipValue = false;
                        }
                        if (episode.StartedWatching == null && episode.Watched == null)
                        {
                            Episode? dbEpisode = db.Episodes.SingleOrDefault(e => e.EpisodeId == episode.Id && e.SiteSection == section);
                            if (dbEpisode != null)
                            {
                                dbEpisode.Skip = newSkipValue;
                            }
                        }
                    }
                    db.SaveChanges();
                }
            }
            return show;
        }

        public ShowModel? UpdateEpisode(SiteSection section, uint showId, EpisodeModel episodeModel)
        {
            Episode? episode = db.Episodes.SingleOrDefault(e => e.EpisodeId == episodeModel.Id && e.SiteSection == episodeModel.SiteSection);
            if (episode == null)
            {
                if (AddShow(section, showId))
                {
                    episode = db.Episodes.SingleOrDefault(e => e.EpisodeId == episodeModel.Id && e.SiteSection == episodeModel.SiteSection);
                }
            }
            if (episode != null)
            {
                episode.Watched = episodeModel.Watched;
                episode.StartedWatching = episodeModel.StartedWatching;
                episode.Skip = episodeModel.Skip;
                episode.RequestDownload = episodeModel.RequestDownload;

                db.SaveChanges();

                return GetShow(section, showId);
            }
            return null;
        }


        public EpisodeModel? AddTorrentHash(EpisodeModel episode, string hash)
        {
            if (Regex.IsMatch(hash, "^[a-zA-Z0-9]{40}$"))
            {
                var clashingTorrent = db.Torrents.SingleOrDefault(t => t.Hash == hash);
                if (clashingTorrent == null)
                {
                    db.Torrents.Add(new()
                    {
                        EpisodeId = episode.Id,
                        SiteSection = episode.SiteSection,
                        Name = episode.Name,
                        Hash = hash,
                        Added = DateTime.Now,
                        ManuallyAdded = true,
                    });
                    db.SaveChanges();
                    return GetEpisode(episode.SiteSection, episode.Id);
                }
            }

            return null;
        }


        public ShowModel? CreateList(string name, List<EpisodeId> episodes)
        {
            List newList = new List
            {
                Name = name,
                Created = DateTime.Now
            };
            db.Lists.Add(newList);
            db.SaveChanges();

            return AddToList(newList.ListId, episodes);
        }

        public ShowModel? AddToList(uint listId, List<EpisodeId> episodes)
        {
            List<ListEntry> listEntries = db.ListEntries.Where(e => e.ListId == listId).ToList();
            short rankCounter = (short)(listEntries.Count + 1);

            foreach (EpisodeId episode in episodes)
            {
                if (listEntries.SingleOrDefault(e => e.EpisodeId == episode.Id && e.SiteSection == episode.Section) == null)
                {
                    if (db.Episodes.SingleOrDefault(e => e.EpisodeId == episode.Id && e.SiteSection == episode.Section) == null)
                    {
                        SiteSection section = (SiteSection)episode.Section;
                        AddShow(section, GetShowIdFromEpisodeFromProviderAsync(section, episode.Id).Result);
                    }

                    db.ListEntries.Add(new()
                    {
                        ListId = listId,
                        EpisodeId = episode.Id,
                        SiteSection = episode.Section,
                        Rank = rankCounter
                    });
                    rankCounter++;
                }
            }
            db.SaveChanges();

            return GetShow(SiteSection.Lists, listId);
        }

        public ShowModel? UpdateList(uint id, string name, List<EpisodeId> episodes)
        {
            List? list = db.Lists.SingleOrDefault(l => l.ListId == id);
            if (list != null)
            {
                list.Name = name;

                List<ListEntry> listEntries = db.ListEntries.Where(e => e.ListId == id).ToList();
                db.ListEntries.RemoveRange(listEntries);

                short rankCounter = 1;
                foreach (EpisodeId episode in episodes)
                {
                    db.ListEntries.Add(new()
                    {
                        ListId = id,
                        EpisodeId = episode.Id,
                        SiteSection = episode.Section,
                        Rank = rankCounter
                    });
                    rankCounter++;
                }

                db.SaveChanges();
            }

            return GetShow(SiteSection.Lists, id);
        }

        public bool DeleteList(uint listId)
        {
            List? list = db.Lists.SingleOrDefault(l => l.ListId == listId);
            if (list != null)
            {
                List<ListEntry> listEntries = db.ListEntries.Where(e => e.ListId == listId).ToList();
                db.ListEntries.RemoveRange(listEntries);

                db.Lists.Remove(list);

                db.SaveChanges();

                return true;
            }
            return false;
        }


        public List<ShowModel> Shows(SiteSection? section = null, List<uint>? showIds = null)
        {
            return (
                from s in db.Shows
                where section == null || s.SiteSection == section
                where showIds == null || showIds.Contains(s.ShowId)
                select new ShowModel(s, null)
                {
                    Episodes = (
                        from e in db.Episodes
                        where e.ShowId == s.ShowId && e.SiteSection == s.SiteSection
                        select new EpisodeModel(e)
                        {
                            Torrents = (
                                from t in db.Torrents
                                where t.EpisodeId == e.EpisodeId && t.SiteSection == e.SiteSection
                                select t
                            ).ToList()
                        }
                    ).ToList()
                }
            ).ToList();
        }

        public List<ShowModel> ShowsAndLists(SiteSection section, List<uint>? showIds = null)
        {
            List<ShowModel> shows = Shows(section, showIds);

            List<uint> sectionListIds = db.ListEntries.Where(e => e.SiteSection == section).Select(e => e.ListId).Distinct().ToList();
            List<ShowModel> lists = (
                from l in db.Lists
                where sectionListIds.Contains(l.ListId)
                select new ShowModel
                {
                    Id = l.ListId,
                    Name = l.Name,
                    Added = l.Created,
                    IsList = true,
                    Episodes = (
                        from entry in db.ListEntries
                        join e in db.Episodes on new { entry.EpisodeId, entry.SiteSection } equals new { e.EpisodeId, e.SiteSection }
                        where entry.ListId == l.ListId
                        select new EpisodeModel(e)
                        {
                            Torrents = (
                                from t in db.Torrents
                                where t.EpisodeId == e.EpisodeId && t.SiteSection == e.SiteSection
                                select t
                            ).ToList()
                        }
                    ).ToList()
                }
            ).ToList();

            //Remove shows where all episodes are in lists
            List<uint> sectionEpisodesInLists = lists.SelectMany(l => l.Episodes.Where(e => e.SiteSection == section).Select(e => e.Id)).ToList();
            shows = shows.Where(s => s.Episodes.Select(e => e.Id).Except(sectionEpisodesInLists).Count() > 0).ToList();

            return shows.Concat(lists).ToList();
        }

        public List<ShowModel> CurrentlyWatching(SiteSection section)
        {
            return Shows(section, (
                from e in db.Episodes
                where e.SiteSection == section
                where e.AirDate != null && e.AirDate < DateTime.Now && !e.Skip
                group e by e.ShowId into grp
                where grp.Count() > grp.Count(g => g.Watched != null)
                where grp.Count(g => g.Watched != null) > 0
                select grp.Key
            ).ToList());
        }

        public List<ShowModel> NotStarted(SiteSection section)
        {
            return Shows(section, (
                from e in db.Episodes
                where e.SiteSection == section
                where !e.Skip
                group e by e.ShowId into grp
                where grp.Count(g => g.Watched != null) == 0 && grp.Count(g => g.StartedWatching != null) == 0
                select grp.Key
            ).ToList());
        }

        public List<ShowModel> Search(SiteSection section, string query)
        {
            if (!string.IsNullOrEmpty(query))
            {
                if (section == SiteSection.TV)
                {
                    return new TVMaze(db).SearchAsync(this, query).Result;
                }
                if (section == SiteSection.Movies)
                {
                    return new TheMovieDB(db).SearchAsync(this, query).Result;
                }
                if (section == SiteSection.Books)
                {
                    return new Goodreads(db).SearchAsync(this, query).Result;
                }
            }
            throw new NotImplementedException();
        }

    }
}
