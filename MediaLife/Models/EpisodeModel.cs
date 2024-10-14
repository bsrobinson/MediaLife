using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using MediaLife.Library.DAL;
using WCKDRZR.Gaspar;
using MediaLife.Library.Models;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class EpisodeModel
    {
        public string Id { get; set; }
        public SiteSection SiteSection { get; set; }

        public short SeriesNumber { get; set; }
        public short Number { get; set; }
        public string Name { get; set; } = "";
        public string? Poster { get; set; }
        public string? Certificate { get; set; }
        public string? Author { get; set; }

        public DateTime? AirDate { get; set; }
        public DateTime? Watched { get; set; }
        public DateTime? StartedWatching { get; set; }
        public bool Skip { get; set; }

        public string? FilePath { get; set; }
        public bool InCloud { get; set; }
        public bool RequestDownload { get; set; }
        public List<Torrent> Torrents { get; set; }

        public List<List> InLists { get; set; } = new();

        public bool HasTorrents => Torrents.Count > 0;
        public string SeriesEpisodeNumber => "S" + SeriesNumber.ToString("D2") + "E" + Number.ToString("D2");


        public EpisodeModel()
        {
            Id = "";
            Torrents = new();
        }
        public EpisodeModel(Episode episode) : this()
        {
            Id = episode.EpisodeId;
            SiteSection = (SiteSection)episode.SiteSection;
            SeriesNumber = episode.SeriesNumber;
            Number = episode.Number;
            Name = episode.Name;
            AirDate = episode.AirDate;
            Poster = episode.Poster;
            Certificate = episode.Certificate;
            Author = episode.Author;
            Watched = episode.Watched;
            StartedWatching = episode.StartedWatching;
            Skip = episode.Skip;
            FilePath = episode.FilePath;
            InCloud = episode.InCloud;
            RequestDownload = episode.RequestDownload;
        }
        public EpisodeModel(Episode episode, List<Torrent> torrents) : this(episode)
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
                Poster = Poster,
                Certificate = Certificate,
                Author = Author,
                Skip = Skip,
                InCloud = InCloud,
                RequestDownload = RequestDownload,
            };
        }
    }
}
