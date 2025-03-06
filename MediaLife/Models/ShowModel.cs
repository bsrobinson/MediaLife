using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using MediaLife.Extensions;
using MediaLife.Library.DAL;
using WCKDRZR.Gaspar;
using MediaLife.Library.Models;
using System.ComponentModel.DataAnnotations;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class ShowModel : BaseSiteObjectModel
    {
        public string? Poster { get; set; }
        public TvNetwork? Network { get; set; }

        public string? MergeWithParentShowId { get; set; }
        public SiteSection? MergeWithParentSiteSection { get; set; }
        public string? MergeWithParentShowName { get; set; }

        private List<EpisodeModel> _episodes = new();
        public List<EpisodeModel> Episodes
        {
            get
            {
                if (_episodes.Any(e => e.MergedFromShow != null) || SiteSection == SiteSection.YouTube)
                {
                    return [.._episodes.OrderBy(e => e.AirDate).ThenBy(e => e.MergedFromShow == null ? 0 : 1)];
                }
                if (SiteSection == SiteSection.TV)
                {
                    return _episodes.OrderBy(e => e.MergedFromShow == null).ThenBy(e => e.AirDate ?? DateTime.MaxValue).ThenBy(e => e.Number).ToList();
                }
                return [.._episodes.OrderBy(e => e.Number).ThenBy(e => e.MergedFromShow == null ? 0 : 1)];
            }
            set { _episodes = value; }
        }

        public bool IsAdded { get; set; }
        public DateTime? UserAdded { get; set; }

        [Display(Name = "Delete Watched")]
        public bool DeleteWatched { get; set; }
        [Display(Name = "Watch From Next Playable")]
        public bool WatchFromNextPlayable { get; set; }
        [Display(Name = "Download All Together")]
        public bool DownloadAllTogether { get; set; }
        [Display(Name = "Download Limit")]
        public int? DownloadLimit { get; set; }
        [Display(Name = "Download Series Offset")]
        public int? DownloadSeriesOffset { get; set; }
        [Display(Name = "Keep All Downloaded")]
        public bool KeepAllDownloaded { get; set; }
        [Display(Name = "Show Thumbnails")]
        public bool ShowEpisodesAsThumbnails { get; set; }

        [Display(Name = "Recommended By")]
        public string? RecommendedBy { get; set; }

        [Display(Name = "Hide Watched")]
        public bool HideWatched { get; set; }
        [Display(Name = "Hide Unplayable")]
        public bool HideUnplayable { get; set; }

        public double SearchScore { get; set; }

        public bool IsList { get; set; } = false;

        public string SortableName => Name.StartsWith("The ") ? Name.Substring(4) + ", The" : Name;
        public string PosterName => GetPosterName();

        public string? ShowAuthor { get; set; }

        private List<string> UserUnwatchedPosters => UserUnwatched.Where(e => !string.IsNullOrEmpty(e.Poster)).Take(4).Select(e => e.Poster!).ToList();
        public List<string> EpisodePosters => UserUnwatchedPosters.Concat(Episodes.Where(e => !string.IsNullOrEmpty(e.Poster) && !UserUnwatchedPosters.Contains(e.Poster)).Take(4 - UserUnwatchedPosters.Count).Select(e => e.Poster!)).ToList();

        public List<EpisodeId> EpisodeIds => (from e in Episodes select new EpisodeId(e.Id, e.SiteSection)).ToList();

        internal List<EpisodeModel> UserUnwatched => Episodes.Where(e => !e.Skip && !e.UserHasWatched && (e.AirDate <= DateTime.Now || e.HasTorrents || e.FilePath != null || Episodes.Any(e2 => e2.AirDate > DateTime.Now && e2.UserHasWatched))).ToList();
        internal List<EpisodeModel> Unwatched => Episodes.Where(e => !e.Skip && e.WatchStatus == WatchedStatus.Unwatched && (e.AirDate <= DateTime.Now || e.HasTorrents || e.FilePath != null || Episodes.Any(e2 => e2.AirDate > DateTime.Now && e2.UserHasWatched))).ToList();
        private List<EpisodeModel> UserPlayable => UserUnwatched.Where(e => e.FilePath != null).ToList();
        private EpisodeModel? UserActivelyWatching => UserUnwatched.FirstOrDefault(e => e.UserHasStartedWatching);

        public EpisodeModel? NextEpisode => UserActivelyWatching != null ? UserActivelyWatching : (WatchFromNextPlayable && UserPlayable.Count > 0 ? UserPlayable[0] : UserUnwatched.FirstOrDefault());
        public EpisodeModel? EpisodeAfterNext => WatchFromNextPlayable ? (UserPlayable.Count > 1 ? UserPlayable[1] : (UserPlayable.Count > 0 ? UserUnwatched.FirstOrDefault() : UserUnwatched.SecondOrDefault())) : UserUnwatched.SecondOrDefault();
        public int EpisodeCount => Episodes.Count();
        public int UserUnwatchedCount => UserUnwatched.Count();
        public int WatchedCount => Episodes.Count(e => e.UserHasWatched || e.UserHasStartedWatching);
        public int NextEpisodePlayableSort => NextEpisode?.FilePath != null ? 1 : 2;

        public DateTime? FirstAirDate => Episodes.Count == 0 ? null : _episodes.Where(e => e.AirDate != null).OrderBy(e => e.AirDate).FirstOrDefault()?.AirDate;
        public DateTime? LastAirDate => Episodes.Count == 0 ? null : _episodes.Where(e => e.AirDate != null).OrderBy(e => e.AirDate).LastOrDefault()?.AirDate;
        public bool StartedAiring => FirstAirDate <= DateTime.Now;

        public bool Started => WatchedCount > 0;
        public bool UserComplete => UserUnwatchedCount == 0;

        internal List<EpisodeModel> UnSkipped => _episodes.Where(e => !e.Skip).ToList();
        [Display(Name = "Skip Until Series")]
        public short? SkipUntilSeries => _episodes.Count > 0 && UnSkipped.Count > 0 ? UnSkipped.Min(e => e.SeriesNumber) : (short)1;

        public DateTime? LastWatched => Episodes.Max(e => new[] { e.UserStartedWatching, e.Me?.Watched }.Max());
        public DateTime? LatestEpisode => Episodes.Max(e => e.AirDate);
        public bool WatchedRecently => LastWatched > DateTime.Now.AddMonths(-1) || LatestEpisode > DateTime.Now.AddMonths(-1);

        public int EpisodeIndex;

        public List<ShowUserModel> Users { get; set; } = [];
        public string ActiveUserNames => string.Join(", ", Users.Where(u => u.HasAdded).Select(u => u.Name));


        public ShowModel()
        {
            Id = "";
            Name = "";
        }
        public ShowModel(Show show, UserShow? userShow, List<User> accountUsers, List<UserShow> userShows) : this(
            show, userShow, null, userShows
                .Where(u => u.ShowId == show.ShowId && u.SiteSection == show.SiteSection)
                .Select(u => new ShowUserModel()
                    {
                        Id = u.UserId,
                        Name = accountUsers.FirstOrDefault(aU => aU.UserId == u.UserId)?.Name ?? "",
                        HasAdded = true,
                        Me = u.UserId == userShow?.UserId
                    }
                ).ToList()
        ) { }
        public ShowModel(Show show, UserShow? userShow, TvNetwork? network, List<ShowUserModel>? showUsers) : this()
        {
            Id = show.ShowId;
            SiteSection = show.SiteSection;
            Name = show.Name;
            Poster = show.Poster;
            Network = network;
            MergeWithParentShowId = show.MergeWithParentShowId;
            MergeWithParentSiteSection = show.MergeWithParentSiteSection;
            RecommendedBy = userShow?.RecommendedBy;
            HideWatched = userShow?.HideWatched ?? false;
            HideUnplayable = userShow?.HideUnplayable ?? false;
            IsAdded = showUsers?.Any(u => u.HasAdded) ?? false;
            UserAdded = userShow?.Added;
            DeleteWatched = show.DeleteWatched;
            WatchFromNextPlayable = userShow?.WatchFromNextPlayable ?? false;
            DownloadAllTogether = show.DownloadAllTogether;
            KeepAllDownloaded = show.KeepAllDownloaded;
            ShowEpisodesAsThumbnails = userShow?.ShowEpisodesAsThumbnails ?? false;
            DownloadLimit = show.DownloadLimit;
            DownloadSeriesOffset = show.DownloadSeriesOffset;
            Users = showUsers ?? [];
        }

        public void AddEpisode(EpisodeModel episode)
        {
            _episodes.Add(episode);
        }

        public void NumberEpisodesByAirDate()
        {
            _episodes = _episodes.OrderBy(e => e.AirDate).ToList();
            for (int i = 0; i < _episodes.Count; i++)
            {
                _episodes[i].Number = (short)(i + 1);
            }
        }

        public string GetPosterName()
        {
            if (SiteSection == SiteSection.Movies)
            {
                string? firstAirYear = FirstAirDate != null ? ((DateTime)FirstAirDate).ToString("yyyy") : null;
                string? lastAirYear = LastAirDate != null ? ((DateTime)LastAirDate).ToString("yyyy") : null;
                return Name + (FirstAirDate != null ? $" ({firstAirYear}" + (LastAirDate != null && lastAirYear != firstAirYear ? $"-{lastAirYear}" : "") + ")" : "");
            }
            if (SiteSection == SiteSection.Books)
            {
                if (Episodes.Count > 0)
                {
                    string? firstAuthor = _episodes.OrderBy(e => e.AirDate).First().Author;
                    string? modeAuthor = _episodes.GroupBy(e => e.Author)
                        .OrderByDescending(g => g.Count())
                        .First().Key;

                    ShowAuthor = modeAuthor != firstAuthor && Episodes.Count(e => e.Author == firstAuthor) > 2 ? firstAuthor : modeAuthor;
                    return $"{Name} ({ShowAuthor})";
                }
            }

            return Name;

        }
    }

    [ExportFor(GasparType.TypeScript)]
    public class ShowSettings
    {
        public bool HideWatched { get; set; }
        public bool HideUnplayable { get; set; }

        public string? RecommendedBy { get; set; }
        public int? DownloadLimit { get; set; }
        public int? DownloadSeriesOffset { get; set; }
        public bool DeleteWatched { get; set; }
        public bool WatchFromNextPlayable { get; set; }
        public bool DownloadAllTogether { get; set; }
        public bool KeepAllDownloaded { get; set; }
        public bool ShowEpisodesAsThumbnails { get; set; }
        public short SkipUntilSeries { get; set; }

        public List<ShowUserModel> Users { get; set; } = [];
    }

    class IgnoreEpisodesResolver : DefaultContractResolver
    {
        protected override IList<JsonProperty> CreateProperties(Type type, MemberSerialization memberSerialization)
        {
            ShowModel showModel = new();
            IList<JsonProperty> properties = base.CreateProperties(type, memberSerialization);
            foreach (var property in properties)
            {
                property.Ignored = (
                    property.UnderlyingName == nameof(showModel.Episodes)
                );
            }
            return properties;
        }
    }
}
