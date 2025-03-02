﻿using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Policy;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using MediaLife.DataProviders;
using MediaLife.Extensions;
using MediaLife.Library.DAL;
using MediaLife.Library.Models;
using MediaLife.Models;
using Newtonsoft.Json;

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
            PirateBay? piratebay = db.PirateBay.FirstOrDefault(p => p.Active);
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

        public ShowModel? GetShow(SiteSection section, string showId, User? user = null)
        {
            Show? show = null;
            List<EpisodeModel>? episodes = null;
            List<UserShow> showUsers = db.UserShows.Where(u => u.ShowId == showId).ToList();
            UserShow? userShow = showUsers.FirstOrDefault(u => u.UserId == user?.UserId);

            if (section == SiteSection.Lists)
            {
                List? list = db.Lists.SingleOrDefault(l => l.ListId.ToString() == showId);
                if (list != null)
                {
                    uint UserId = user?.UserId ?? 0;
                    show = new() { ShowId = showId, SiteSection = section, Name = list.Name, Updated = list.Created, DeleteWatched = false, DownloadAllTogether = false, KeepAllDownloaded = false };
                    episodes = (
                        from e in db.Episodes
                        join userEp in db.UserEpisodes on new { e.EpisodeId, e.SiteSection, UserId } equals new { userEp.EpisodeId, userEp.SiteSection, userEp.UserId } into x from userEp in x.DefaultIfEmpty()
                        join l in db.ListEntries on new { e.EpisodeId, e.SiteSection } equals new { l.EpisodeId, l.SiteSection }
                        where l.ListId.ToString() == showId
                        where userEp == null || userEp.UserId == UserId
                        select new EpisodeModel(e, userEp)
                        {
                            Number = (short)l.Rank,
                            Torrents = (
                                from t in db.Torrents
                                where t.EpisodeId == e.EpisodeId && t.SiteSection == e.SiteSection
                                select t
                            ).ToList(),
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
                else if (section != SiteSection.TV && section != SiteSection.YouTube) { throw new NotImplementedException(); }

                uint UserId = user?.UserId ?? 0;
                show = db.Shows.SingleOrDefault(s => s.ShowId == showId && s.SiteSection == section);
                episodes = (
                    from e in db.Episodes
                    join userEp in db.UserEpisodes on new { e.EpisodeId, e.SiteSection, UserId } equals new { userEp.EpisodeId, userEp.SiteSection, userEp.UserId } into x from userEp in x.DefaultIfEmpty()
                    where e.ShowId == showId && e.SiteSection == section
                    where userEp == null || userEp.UserId == UserId
                    orderby e.AirDate ?? DateTime.MaxValue, e.Number
                    select new EpisodeModel(e, userEp)
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
                TvNetwork? network =  db.TvNetworks.SingleOrDefault(n => n.NetworkId == show.NetworkId);
                List<ShowUserModel>? users = null;
                if (user != null)
                {
                    users = (
                        from u in db.Users
                        where u.AccountId == user.AccountId
                        select new ShowUserModel()
                        {
                            Id = u.UserId,
                            Name = u.Name,
                            Me = u.UserId == user.UserId,
                            HasAdded = showUsers.Select(su => su.UserId).Contains(u.UserId),
                        }
                    ).ToList();

                    List<UserEpisode> userEpisodes = db.UserEpisodes.ToList();
                    foreach (EpisodeModel episode in episodes)
                    {
                        episode.Users = users.Select(u => new EpisodeUserModel(u, userEpisodes.FirstOrDefault(uEp => uEp.EpisodeId == episode.Id && uEp.SiteSection == episode.SiteSection && uEp.UserId == u.Id))).ToList();
                    }
                }

                return new ShowModel(show, userShow, network, users)
                {
                    Episodes = episodes
                };
            }
            return null;
        }

        public async Task<ShowModel?> GetShowFromProviderAsync(SiteSection section, string showId)
        {
            bool idIsNumeric = int.TryParse(showId, out int numericId);
            if (section == SiteSection.TV && idIsNumeric)
            {
                return await new TVMaze(db).GetShowAsync(numericId);
            }
            if (section == SiteSection.YouTube)
            {
                return await new YouTube(db).GetShowAsync(showId);
            }
            if (section == SiteSection.Movies && idIsNumeric)
            {
                return await new TheMovieDB(db).GetMovieAsync(numericId);
            }
            if (section == SiteSection.Books && idIsNumeric)
            {
                return await new Goodreads(db).GetBookAsync(numericId);
            }
            throw new NotImplementedException();
        }

        public async Task<string> GetShowIdFromEpisodeFromProviderAsync(SiteSection section, string episodeId)
        {
            if (section == SiteSection.TV && int.TryParse(episodeId, out int numericId))
            {
                return (await new TVMaze(db).GetShowIdFromEpisode(numericId) ?? 0).ToString();
            }
            if (section == SiteSection.YouTube || section == SiteSection.Movies || section == SiteSection.Books)
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
                ShowModel? show = GetShow(episode.SiteSection, episode.ShowId);
                if (show != null)
                {
                    show.EpisodeIndex = show.Episodes.FindIndex(e => e.Id == episode.EpisodeId);
                }
                return show;
            }
            return null;
        }

        public EpisodeModel? GetEpisode(SiteSection section, string episodeId, User user)
        {
            Episode? episode = db.Episodes.FirstOrDefault(e => e.EpisodeId == episodeId && e.SiteSection == section);
            if (episode != null)
            {
                UserEpisode? userEpisode = db.UserEpisodes.FirstOrDefault(u => u.EpisodeId == episodeId && u.SiteSection == section && u.UserId == user.UserId);
                return new EpisodeModel(episode, userEpisode, Torrents(section, episodeId));
            }
            return null;
        }

        public List<Torrent> Torrents(SiteSection section, string episodeId)
        {
            return db.Torrents.Where(t => t.EpisodeId == episodeId && t.SiteSection == section).ToList();
        }

        public List<string> Recommenders(User user)
        {
            List<string> names = db.UserShows.Where(s => s.UserId == user.UserId && s.RecommendedBy != null).Select(s => s.RecommendedBy!).Distinct().ToList();
            names.Sort();
            return names;
        }

        public bool SomeEpisodesInList(ShowModel show)
        {
            return db.ListEntries.Where(l => show.Episodes.Select(e => e.Id).Contains(l.EpisodeId)).Count() > 0;
        }

        public ShowModel? AddShow(SiteSection section, string showId, User user, uint? addForUserId = null)
        {
            Show? dbShow = db.Shows.SingleOrDefault(s => s.ShowId == showId);

            ShowModel? showModel = dbShow == null
                ? GetShowFromProviderAsync(section, showId).Result
                : GetShow(section, showId, user);
                
            if (showModel != null)
            {   
                if (dbShow == null)
                {
                    SectionConfig sectionConfig = new ConfigService(db).Config.UserConfig.SectionConfig(section);

                    string showName = showModel.Name;
                    int inc = 2;
                    while (db.Shows.SingleOrDefault(s => s.Name.ToLower() == showName.ToLower() && s.SiteSection == section) != null)
                    {
                        int? firstEpisodeYear = showModel.Episodes.FirstOrDefault()?.AirDate?.Year;
                        showName = $"{showModel.Name}{(firstEpisodeYear != null ? $" {firstEpisodeYear}" : $"_{inc}")}";
                        inc++;
                    }
                    showModel.Name = showName;

                    dbShow = new Show
                    {
                        ShowId = showId,
                        SiteSection = section,
                        Name = showModel.Name,
                        Poster = showModel.Poster,
                        NetworkId = showModel.Network?.NetworkId,
                        Updated = DateTime.Now,
                        DeleteWatched = sectionConfig.DeleteWatched,
                        DownloadSeriesOffset = null,
                        DownloadAllTogether = false,
                        DownloadLimit = sectionConfig.DownloadLimit,
                        KeepAllDownloaded = false,
                    };
                    db.Shows.Add(dbShow);

                    foreach (EpisodeModel episode in showModel.Episodes)
                    {
                        db.Episodes.Add(episode.DBEpisode(section, showId));
                    }
                    db.SaveChanges();
                }
         
                UserShow dbUserShow = new()
                {
                    UserId = addForUserId ?? user.UserId,
                    ShowId = showId,
                    SiteSection = section,
                    Added = DateTime.Now,
                    WatchFromNextPlayable = false,
                    ShowEpisodesAsThumbnails = false,
                    HideWatched = false,
                    HideUnplayable = false,
                };
                db.UserShows.Add(dbUserShow);
                db.SaveChanges();

                List<User> accountUsers = db.Users.Where(u => u.AccountId == user.AccountId).ToList();
                showModel.Users = accountUsers.Select(u => new ShowUserModel()
                {
                    Id = u.UserId,
                    Name = u.Name,
                    Me = u.UserId == user.UserId,
                    HasAdded = db.UserShows.Any(us => us.ShowId == showId && us.UserId == u.UserId),
                }).ToList();

                return showModel;
            }

            return null;
        }

        public bool RemoveShow(SiteSection section, string showId, User user)
        {
            Show? dbShow = db.Shows.SingleOrDefault(s => s.ShowId == showId && s.SiteSection == section);
            if (dbShow != null)
            {
                List<uint> accountUserIds = db.Users.Where(u => u.AccountId == user.AccountId).Select(u => u.UserId).ToList();
                List<UserShow> userShows = db.UserShows.Where(u => u.ShowId == showId && u.SiteSection == section && accountUserIds.Contains(u.UserId)).ToList();

                List<Episode> episodes = db.Episodes.Where(e => e.ShowId == showId && e.SiteSection == section).ToList();
                if (!db.UserEpisodes.Any(u => episodes.Select(e => e.EpisodeId).Contains(u.EpisodeId) && u.SiteSection == section && accountUserIds.Contains(u.UserId)))
                {
                    if (db.ListEntries.Where(l => episodes.Select(e => e.EpisodeId).Contains(l.EpisodeId)).Count() == 0)
                    {
                        db.Episodes.RemoveRange(episodes);
                        db.UserShows.RemoveRange(userShows);
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
                if (configSrv.Config.UserConfig.SectionConfig(section).UpdateFromDataProvider)
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

        public async Task<string?> UpdateShowAsync(SiteSection section, string showId)
        {
            if (section == SiteSection.Lists && uint.TryParse(showId, out uint numericId))
            {
                return UpdateList(numericId) ? null : "Failed to update list";
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
                        if (showModel.Episodes.SingleOrDefault(e => e.Id == episode.EpisodeId && e.SiteSection == section) == null)
                        {
                            //Unless watched
                            UserEpisode? userEpisode = db.UserEpisodes.FirstOrDefault(u => u.EpisodeId == episode.EpisodeId && u.SiteSection == section);
                            if (userEpisode == null)
                            {
                                episodesToDelete.Add(episode);
                            }
                        }
                    }
                    db.Episodes.RemoveRange(episodesToDelete);

                    //Update show name
                    if (showModel.Name != null && dbShow.Name != showModel.Name)
                    {
                        if (db.Shows.SingleOrDefault(s => s.ShowId != showModel.Id && s.Name.ToLower() == showModel.Name.ToLower() && s.SiteSection == section) == null)
                        {
                            dbShow.Name = showModel.Name;
                        }
                    }

                    //Update show from feed
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
                string showId = db.Episodes.Single(e => e.EpisodeId == entry.EpisodeId && entry.SiteSection == entry.SiteSection).ShowId;
                string? result = UpdateShowAsync((SiteSection)entry.SiteSection, showId).Result;
                if (result != null)
                {
                    results.Add(result);
                }
            }
            return results.All(t => t == null);
        }

        public UserShow? RemoveFilters(SiteSection section, string showId, User user)
        {
            UserShow? userShow = db.UserShows.SingleOrDefault(s => s.ShowId == showId && s.UserId == user.UserId && s.SiteSection == section);
            if (userShow != null)
            {
                userShow.HideWatched = false;
                userShow.HideUnplayable = false;
                db.SaveChanges();
            }
            return userShow;
        }

        public Show? UpdateSettings(SiteSection section, string showId, ShowSettings model, User user)
        {
            Show? show = db.Shows.SingleOrDefault(s => s.ShowId == showId && s.SiteSection == section);
            ShowModel? showModel = GetShow(section, showId);
            if (show != null)
            {
                show.DownloadSeriesOffset = model.DownloadSeriesOffset;
                show.DeleteWatched = model.DeleteWatched;
                show.DownloadAllTogether = model.DownloadAllTogether;
                show.DownloadLimit = model.DownloadLimit;
                show.KeepAllDownloaded = model.KeepAllDownloaded;
                db.SaveChanges();

                //Set Skip
                if (showModel != null && showModel.SkipUntilSeries != model.SkipUntilSeries)
                {
                    bool newSkipValue = true;
                    foreach (EpisodeModel episode in showModel.Episodes.Where(e => e.SeriesNumber < new[] { showModel.SkipUntilSeries, model.SkipUntilSeries }.Max()))
                    {
                        if (episode.SeriesNumber == model.SkipUntilSeries)
                        {
                            newSkipValue = false;
                        }
                        if (episode.UserStartedWatching == null && episode.UserHasWatched == false)
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

            List<UserShow> userShows = db.UserShows.Where(s => s.ShowId == showId && s.SiteSection == section).ToList();
            UserShow? userShow = userShows.FirstOrDefault(s => s.UserId == user.UserId);
            if (userShow != null)
            {
                userShow.RecommendedBy = model.RecommendedBy;
                userShow.WatchFromNextPlayable = model.WatchFromNextPlayable;
                userShow.ShowEpisodesAsThumbnails = model.ShowEpisodesAsThumbnails;
                userShow.HideWatched = model.HideWatched;
                userShow.HideUnplayable = model.HideUnplayable;
                db.SaveChanges();
            }

            if (model.Users.Any(u => u.HasAdded))
            {
                foreach (ShowUserModel userModel in model.Users)
                {
                    if (userModel.HasAdded && !userShows.Any(s => s.UserId == userModel.Id))
                    {
                        AddShow(section, showId, user, userModel.Id);
                    }
                    if (!userModel.HasAdded)
                    {
                        UserShow? userShowToRemove = userShows.FirstOrDefault(s => s.UserId == userModel.Id);
                        if (userShowToRemove != null)
                        {
                            foreach (EpisodeModel episode in showModel?.Episodes ?? [])
                            {
                                UserEpisode? userEpisodeToRemove = db.UserEpisodes.FirstOrDefault(e => e.UserId == userModel.Id && e.EpisodeId == episode.Id && e.SiteSection == section);
                                if (userEpisodeToRemove != null)
                                {
                                    db.UserEpisodes.Remove(userEpisodeToRemove);
                                }
                            }
                            db.UserShows.Remove(userShowToRemove);
                            db.SaveChanges();
                        }
                    }
                }
            }

            return show;
        }

        public ShowModel? UpdateEpisode(SiteSection section, string showId, User user, EpisodeModel episodeModel, bool updateAllUsers)
        {
            Episode? episode = db.Episodes.SingleOrDefault(e => e.EpisodeId == episodeModel.Id && e.SiteSection == episodeModel.SiteSection);
            if (episode == null)
            {
                if (AddShow(section, showId, user) != null)
                {
                    episode = db.Episodes.SingleOrDefault(e => e.EpisodeId == episodeModel.Id && e.SiteSection == episodeModel.SiteSection);
                }
            }
            if (episode != null)
            {
                foreach (EpisodeUserModel userModel in episodeModel.Users)
                {
                    if (userModel.Me || (updateAllUsers && userModel.HasAdded))
                    {
                        UserEpisode? userEpisode = db.UserEpisodes.FirstOrDefault(u => u.EpisodeId == episodeModel.Id && u.SiteSection == episodeModel.SiteSection && u.UserId == userModel.Id);
                        if (userEpisode == null && (episodeModel.UserHasWatched || episodeModel.UserStartedWatching != null))
                        {
                            db.UserEpisodes.Add(new()
                            {
                                EpisodeId = episodeModel.Id,
                                SiteSection = episodeModel.SiteSection,
                                UserId = userModel.Id,
                                Watched = userModel.Watched,
                                StartedWatching = episodeModel.UserStartedWatching,
                            });
                        }
                        if (userEpisode != null)
                        {
                            if (episodeModel.UserHasWatched == false && episodeModel.UserStartedWatching == null)
                            {
                                db.UserEpisodes.Remove(userEpisode);
                            }
                            else
                            {
                                userEpisode.Watched = userModel.Watched;
                                userEpisode.StartedWatching = episodeModel.UserStartedWatching;
                            }
                        }
                    }
                }
                episode.Skip = episodeModel.Skip;
                episode.RequestDownload = episodeModel.RequestDownload;

                db.SaveChanges();

                return GetShow(section, showId, user);
            }
            return null;
        }


        public EpisodeModel? AddTorrentHash(EpisodeModel episode, string hash, User user)
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
                        LastPercentage = 0,
                    });
                    db.SaveChanges();
                    
                    return GetEpisode(episode.SiteSection, episode.Id, user);
                }
            }

            return null;
        }


        public ShowModel? CreateList(string name, User user, List<EpisodeId> episodes)
        {
            List newList = new List
            {
                Name = name,
                Created = DateTime.Now
            };
            db.Lists.Add(newList);
            db.SaveChanges();

            return AddToList(newList.ListId, user, episodes);
        }

        public ShowModel? AddToList(uint listId, User user, List<EpisodeId> episodes)
        {
            List<ListEntry> listEntries = db.ListEntries.Where(e => e.ListId == listId).ToList();
            short rankCounter = (short)(listEntries.Count + 1);

            foreach (EpisodeId episode in episodes)
            {
                if (listEntries.SingleOrDefault(e => e.EpisodeId == episode.Id && e.SiteSection == episode.Section) == null)
                {
                    if (db.Episodes.SingleOrDefault(e => e.EpisodeId == episode.Id && e.SiteSection == episode.Section) == null)
                    {
                        AddShow(episode.Section, GetShowIdFromEpisodeFromProviderAsync(episode.Section, episode.Id).Result, user);
                    }

                    db.ListEntries.Add(new()
                    {
                        ListId = listId,
                        EpisodeId = episode.Id,
                        SiteSection = episode.Section,
                        Rank = (ushort)rankCounter
                    });
                    rankCounter++;
                }
            }
            db.SaveChanges();

            return GetShow(SiteSection.Lists, listId.ToString());
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
                        Rank = (ushort)rankCounter
                    });
                    rankCounter++;
                }

                db.SaveChanges();
            }

            return GetShow(SiteSection.Lists, id.ToString());
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


        public List<ShowModel> AnonShows(SiteSection? section = null, List<string>? showIds = null)
        {
            List<UserShow> userShows = db.UserShows.ToList();
            List<User> users = db.Users.ToList();
            return (
                from s in db.Shows
                where section == null || s.SiteSection == section
                where showIds == null || showIds.Contains(s.ShowId)
                select new ShowModel(s, null, users, userShows)
                {
                    Episodes = (
                        from e in db.Episodes
                        where e.ShowId == s.ShowId && e.SiteSection == s.SiteSection
                        select new EpisodeModel(e, null)
                        {
                            Torrents = (
                                from t in db.Torrents
                                where t.EpisodeId == e.EpisodeId && t.SiteSection == e.SiteSection
                                select t
                            ).ToList(),
                            Users = (
                                from uEp in db.UserEpisodes
                                join u in db.Users on uEp.UserId equals u.UserId
                                where uEp.EpisodeId == e.EpisodeId && uEp.SiteSection == e.SiteSection
                                select new EpisodeUserModel(new()
                                {
                                    Id = u.UserId,
                                    Name = u.Name,
                                    HasAdded = true,
                                }, uEp)
                            ).ToList()
                        }
                    ).ToList()
                }
            ).ToList();
        }

        public List<ShowModel> UsersShows(User user, SiteSection section, List<string> showIds)
        {
            List<UserShow> userShows = db.UserShows.ToList();
            List<User> accountUsers = db.Users.Where(u => u.AccountId == user.AccountId).ToList();
            return (
                from s in db.Shows
                join u in db.UserShows on new { s.ShowId, s.SiteSection, user.UserId } equals new { u.ShowId, u.SiteSection, u.UserId }
                where s.SiteSection == section
                where showIds.Contains(s.ShowId)
                select new ShowModel(s, u, accountUsers, userShows)
                {
                    Episodes = (
                        from e in db.Episodes
                        join userEp in db.UserEpisodes on new { e.EpisodeId, e.SiteSection, user.UserId } equals new { userEp.EpisodeId, userEp.SiteSection, userEp.UserId } into x from userEp in x.DefaultIfEmpty()
                        where e.ShowId == s.ShowId && e.SiteSection == s.SiteSection
                        where user == null || userEp == null || userEp.UserId == user.UserId
                        select new EpisodeModel(e, userEp)
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

        public List<ShowModel> ShowsAndLists(User user, SiteSection section, List<string>? showIds = null)
        {
            List<ShowModel> shows = UsersShows(user, section, showIds ?? []);

            List<uint> sectionListIds = db.ListEntries.Where(e => e.SiteSection == section).Select(e => e.ListId).Distinct().ToList();
            List<ShowModel> lists = (
                from l in db.Lists
                where sectionListIds.Contains(l.ListId)
                select new ShowModel
                {
                    Id = l.ListId.ToString(),
                    Name = l.Name,
                    IsAdded = true,
                    IsList = true,
                    Episodes = (
                        from entry in db.ListEntries
                        join e in db.Episodes on new { entry.EpisodeId, entry.SiteSection } equals new { e.EpisodeId, e.SiteSection }
                        join userEp in db.UserEpisodes on new { e.EpisodeId, e.SiteSection, user.UserId } equals new { userEp.EpisodeId, userEp.SiteSection, userEp.UserId } into x from userEp in x.DefaultIfEmpty()
                        where entry.ListId == l.ListId
                        where user == null || userEp == null || userEp.UserId == user.UserId
                        select new EpisodeModel(e, userEp)
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
            List<string> sectionEpisodesInLists = lists.SelectMany(l => l.Episodes.Where(e => e.SiteSection == section).Select(e => e.Id)).ToList();
            shows = shows.Where(s => s.Episodes.Select(e => e.Id).Except(sectionEpisodesInLists).Any()).ToList();

            return shows.Concat(lists).ToList();
        }

        public List<ShowModel> CurrentlyWatching(User user, SiteSection section)
        {
            return UsersShows(user, section, (
                from e in db.Episodes
                join userEp in db.UserEpisodes on new { e.EpisodeId, e.SiteSection, user.UserId  } equals new { userEp.EpisodeId, userEp.SiteSection, userEp.UserId } into x from userEp in x.DefaultIfEmpty()
                where e.SiteSection == section
                where e.AirDate != null && e.AirDate < DateTime.Now && !e.Skip
                group new { e, userEp } by e.ShowId into grp
                where grp.Count() > grp.Count(g => g.userEp != null && g.userEp.Watched != null)
                where grp.Count(g => g.userEp != null) > 0
                select grp.Key
            ).ToList());
        }

        public List<ShowModel> NotStarted(User user, SiteSection section)
        {
            return UsersShows(user, section, (
                from e in db.Episodes
                join userEp in db.UserEpisodes on new { e.EpisodeId, e.SiteSection, user.UserId } equals new { userEp.EpisodeId, userEp.SiteSection, userEp.UserId } into x from userEp in x.DefaultIfEmpty()
                where e.SiteSection == section
                where !e.Skip
                where userEp == null
                group e by e.ShowId into grp
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
                if (section == SiteSection.YouTube)
                {
                    return new YouTube(db).SearchAsync(this, query).Result;
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
