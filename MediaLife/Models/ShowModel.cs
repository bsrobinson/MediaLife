﻿using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using MediaLife.Extensions;
using MediaLife.Library.DAL;
using WCKDRZR.Gaspar;
using MediaLife.Library.Models;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class ShowModel
    {
        public uint Id { get; set; }
        public SiteSection SiteSection { get; set; }

        public string Name { get; set; }
        public string? Poster { get; set; }
        public TVNetwork? Network { get; set; }

        private List<EpisodeModel> _episodes = new();
        public List<EpisodeModel> Episodes
        {
            get
            {
                if (SiteSection == SiteSection.TV)
                {
                    return _episodes.OrderBy(e => e.SeriesNumber).ThenBy(e => e.AirDate ?? DateTime.MaxValue).ThenBy(e => e.Number).ToList();
                }
                else
                {
                    return _episodes.OrderBy(e => e.Number).ToList();
                }
            }
            set { _episodes = value; }
        }

        public DateTime? Added { get; set; }
        public bool DeleteWatched { get; set; }
        public bool WatchFromNextPlayable { get; set; }
        public bool DownloadAllTogether { get; set; }
        public int? DownloadLimit { get; set; }

        public string? RecommendedBy { get; set; }

        public double SearchScore { get; set; }

        public bool IsList { get; set; } = false;

        public string SortableName => Name.StartsWith("The ") ? Name.Substring(4) + ", The" : Name;
        public string PosterName => GetPosterName();

        public string? ShowAuthor { get; set; }

        private List<string> UnwatchedPosters => Unwatched.Where(e => !string.IsNullOrEmpty(e.Poster)).Take(4).Select(e => e.Poster!).ToList();
        public List<string> EpisodePosters => UnwatchedPosters.Concat(Episodes.Where(e => !string.IsNullOrEmpty(e.Poster) && !UnwatchedPosters.Contains(e.Poster)).Take(4 - UnwatchedPosters.Count).Select(e => e.Poster!)).ToList();

        public List<EpisodeId> EpisodeIds => (from e in Episodes select new EpisodeId(e.Id, e.SiteSection)).ToList();

        internal List<EpisodeModel> Unwatched => Episodes.Where(e => !e.Skip && e.Watched == null && (e.AirDate <= DateTime.Now || e.HasTorrests || e.FilePath != null || Episodes.Any(e2 => e2.AirDate > DateTime.Now && e2.Watched != null))).ToList();
        private List<EpisodeModel> Playable => Unwatched.Where(e => e.FilePath != null).ToList();
        private EpisodeModel? ActivelyWatching => Unwatched.FirstOrDefault(e => e.StartedWatching != null);

        public EpisodeModel? NextEpisode => ActivelyWatching != null ? ActivelyWatching : (WatchFromNextPlayable && Playable.Count > 0 ? Playable[0] : Unwatched.FirstOrDefault());
        public EpisodeModel? EpisodeAfterNext => WatchFromNextPlayable ? (Playable.Count > 1 ? Playable[1] : (Playable.Count > 0 ? Unwatched.FirstOrDefault() : Unwatched.SecondOrDefault())) : Unwatched.SecondOrDefault();
        public int EpisodeCount => Episodes.Count();
        public int UnwatchedCount => Unwatched.Count();
        public int WatchedCount => Episodes.Count(e => e.Watched != null || e.StartedWatching != null);
        public int NextEpisodePlayableSort => NextEpisode?.FilePath != null ? 1 : 2;

        public DateTime? FirstAirDate => Episodes.Count == 0 ? null : _episodes.Where(e => e.AirDate != null).OrderBy(e => e.AirDate).FirstOrDefault()?.AirDate;
        public DateTime? LastAirDate => Episodes.Count == 0 ? null : _episodes.Where(e => e.AirDate != null).OrderBy(e => e.AirDate).LastOrDefault()?.AirDate;
        public bool StartedAiring => FirstAirDate <= DateTime.Now;

        public bool Started => WatchedCount > 0;
        public bool Complete => UnwatchedCount == 0;

        internal List<EpisodeModel> UnSkipped => _episodes.Where(e => !e.Skip).ToList();
        public short? SkipUntilSeries => _episodes.Count > 0 && UnSkipped.Count > 0 ? UnSkipped.Min(e => e.SeriesNumber) : (short)1;

        public DateTime? LastWatched => Episodes.Max(e => new[] { e.StartedWatching, e.Watched }.Max());
        public DateTime? LatestEpisode => Episodes.Max(e => e.AirDate);
        public bool WatchedRecently => LastWatched > DateTime.Now.AddMonths(-1) || LatestEpisode > DateTime.Now.AddMonths(-1);

        public int EpisodeIndex;

        public ShowModel()
        {
            Name = "";
        }
        public ShowModel(Show show, TVNetwork? network) : this()
        {
            Id = show.ShowId;
            SiteSection = (SiteSection)show.SiteSection;
            Name = show.Name;
            Poster = show.Poster;
            Network = network;
            RecommendedBy = show.RecommendedBy;
            Added = show.Added;
            DeleteWatched = show.DeleteWatched;
            WatchFromNextPlayable = show.WatchFromNextPlayable;
            DownloadAllTogether = show.DownloadAllTogether;
            DownloadLimit = show.DownloadLimit;
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
        public string? RecommendedBy { get; set; }
        public int? DownloadLimit { get; set; }
        public bool DeleteWatched { get; set; }
        public bool WatchFromNextPlayable { get; set; }
        public bool DownloadAllTogether { get; set; }
        public short SkipUntilSeries { get; set; }
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
