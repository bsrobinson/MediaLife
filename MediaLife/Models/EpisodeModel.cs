using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using MediaLife.Library.DAL;
using WCKDRZR.Gaspar;
using MediaLife.Library.Models;
using System.Linq;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class EpisodeModel : BaseSiteObjectModel
    {
        public short SeriesNumber { get; set; }
        public short Number { get; set; }
        public string? Poster { get; set; }
        public string? Certificate { get; set; }
        public string? Author { get; set; }

        public DateTime? AirDate { get; set; }
        public double? DurationSeconds { get; set; }
        public DateTime? UserWatched => Me?.Watched;
        public DateTime? UserStartedWatching { get; set; }
        public bool Skip { get; set; }

        public bool UserHasWatched => UserWatched != null;
        public bool UserHasStartedWatching => UserStartedWatching != null;
        public WatchedStatus WatchStatus => Users.Count > 0 && Users.Where(u => u.HasAdded).All(u => u.Watched != null) ? WatchedStatus.EveryoneWatched : WatchedStatus.Unwatched;
        public UserWatchedStatus UserWatchedStatus { get {
            bool someWatched = Users.Any(u => u.Watched != null);
            if (!someWatched && !UserHasStartedWatching)
            {
                return UserWatchedStatus.Unwatched;
            }
            if (Me?.HasAdded == true)
            {
                bool allWatched = Users.Where(u => u.HasAdded).All(u => u.Watched != null);
                if (allWatched) { return UserWatchedStatus.MyShowEveryoneWatched; }
                if (Me?.Watched != null) { return UserWatchedStatus.IWatched; }
                if (UserHasStartedWatching) { return UserWatchedStatus.MyShowIStartedWatching; }
                return UserWatchedStatus.MyShowSomeWatched;
            }
            if (Me?.Watched != null)
            {
                return UserWatchedStatus.IWatched;
            }
            return UserHasStartedWatching ? UserWatchedStatus.MyShowIStartedWatching : UserWatchedStatus.SomeWatched;
        } }

        public string? FilePath { get; set; }
        public bool InCloud { get; set; }
        public bool RequestDownload { get; set; }
        public List<Torrent> Torrents { get; set; }

        public List<EpisodeUserModel> Users { get; set; } = [];
        public EpisodeUserModel? Me => Users.FirstOrDefault(u => u.Me);

        public List<List> InLists { get; set; } = new();

        public bool HasTorrents => Torrents.Count > 0;
        public string SeriesEpisodeNumber => "S" + SeriesNumber.ToString("D2") + "E" + Number.ToString("D2");

        public BaseSiteObjectModel? MergedFromShow { get; set; }

        public string SeriesEpisodeNumberWithOffset(int? offset) => "S" + (SeriesNumber + (offset ?? 0)).ToString("D2") + "E" + Number.ToString("D2");


        public EpisodeModel()
        {
            Id = "";
            Torrents = new();
        }
        public EpisodeModel(Episode episode, UserEpisode? userEpisode) : this()
        {
            Id = episode.EpisodeId;
            SiteSection = episode.SiteSection;
            SeriesNumber = episode.SeriesNumber;
            Number = episode.Number;
            Name = episode.Name;
            AirDate = episode.AirDate;
            DurationSeconds = episode.DurationSeconds;
            Poster = episode.Poster;
            Certificate = episode.Certificate;
            Author = episode.Author;
            UserStartedWatching = userEpisode?.StartedWatching;
            Users = [new(new() { Name = "", Me = true, HasAdded = true }, userEpisode)];
            Skip = episode.Skip;
            FilePath = episode.FilePath;
            InCloud = episode.InCloud;
            RequestDownload = episode.RequestDownload;
        }
        public EpisodeModel(Episode episode, UserEpisode? userEpisode, List<Torrent> torrents) : this(episode, userEpisode)
        {
            Torrents = torrents;
        }

        public Episode DBEpisode(SiteSection section, string showId)
        {
            return new Episode
            {
                EpisodeId = Id,
                SiteSection = section,
                ShowId = showId,
                SeriesNumber = SeriesNumber,
                Number = Number,
                Name = Name,
                AirDate = AirDate,
                DurationSeconds = DurationSeconds,
                Poster = Poster,
                Certificate = Certificate,
                Author = Author,
                Skip = Skip,
                InCloud = InCloud,
                RequestDownload = RequestDownload,
                FilePath = FilePath,
            };
        }
    }

    [ExportFor(GasparType.TypeScript)]
    public enum UserWatchedStatus
    {
        IWatched,               // I added, and I watched, some other have not
        MyShowEveryoneWatched,  // I added, and everyone who added has watched
        MyShowIStartedWatching, // I added, and I started watching
        MyShowSomeWatched,      // I added, and people other than me have watched
        SomeWatched,            // Some users watched, I did not add
        Unwatched,              // Nobody has watched
    }

    [ExportFor(GasparType.TypeScript)]
    public enum WatchedStatus
    {
        EveryoneWatched,
        Unwatched,
    }
}
