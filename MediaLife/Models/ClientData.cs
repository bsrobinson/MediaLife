using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Force.DeepCloner;
using MediaLife.Extensions;
using MediaLife.Library.DAL;
using MediaLife.Library.Models;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    public class ClientData
    {
        public string? UnwatchedTag { get; set; }
        public List<ClientFile> Files { get; set; } = new();
        public List<ClientTorrent> Torrents { get; set; } = new();

        public void MatchEpisodes(List<ShowModel> shows)
        {
            for (int i = Files.Count - 1; i >= 0; i--)
            {
                Files[i].MatchEpisode(shows);

                //remove invalid file and duplicates
                if (!Files[i].Valid || Files.Count(f => f.Show?.SiteSection == Files[i]?.Show?.SiteSection && f.Show?.Id == Files[i]?.Show?.Id && f.Episode?.Id == Files[i]?.Episode?.Id) > 1)
                {
                    Files.RemoveAt(i);
                }
            }

            foreach (ClientTorrent torrent in Torrents)
            {
                torrent.MatchEpisode(shows);

                ClientFile? matchingFile = Files.SingleOrDefault(f => f.Episode?.Id == torrent.Episode?.Id && f.Episode?.SiteSection == torrent.Episode?.SiteSection);
                if (matchingFile != null && torrent.Episode != null)
                {
                    torrent.Episode.FilePath = matchingFile.Episode?.FilePath;
                }
            }
        }
    }

    [ExportFor(GasparType.TypeScript)]
    public class ClientFile
    {
        public SiteSection FileType { get; set; }

        public string? Path { get; set; }
        public List<string> Tags { get; set; } = new();
        public bool InCloud { get; set; }
        public double? DurationSeconds { get; set; }

        public ShowModel? Show { get; set; }
        public EpisodeModel? Episode { get; set; }

        public bool Valid => !string.IsNullOrEmpty(Path) && Show != null && Episode != null;

        public void MatchEpisode(List<ShowModel> shows)
        {
            Show = null;
            Episode = null;

            string? fileName = Path?.FileName();
            if (fileName != null)
            {
                if (FileType == SiteSection.TV)
                {
                    if (fileName.IsVideoFile())
                    {
                        Match seriesEpisodeNumber = new Regex(@"S\d{2,4}E\d{2}", RegexOptions.IgnoreCase).Match(fileName);
                        if (seriesEpisodeNumber.Success)
                        {
                            List<string> cleansedFileNames = new() {
                                fileName.Trim(),
                                fileName.Replace(".", " ").Trim(),
                                fileName.Replace("-", " ").Trim(),
                                fileName.Replace(".", "").Replace("-", "").Trim()
                            };
                            IEnumerable<ShowModel> matchingShows = shows.Where(s => cleansedFileNames.Any(n => n.StartsWith(s.Name, true, CultureInfo.CurrentCulture) && s.SiteSection == SiteSection.TV));
                            
                            if (matchingShows.Count() >= 1)
                            {
                                Show = matchingShows.OrderByDescending(s => s.Name.LevenshteinDistance(fileName)).First().DeepClone();

                                int episodeIndex = seriesEpisodeNumber.Value.IndexOf("E", StringComparison.OrdinalIgnoreCase);
                                if (short.TryParse(seriesEpisodeNumber.Value.Substring(1, episodeIndex - 1), out short seriesNumber)
                                    && short.TryParse(seriesEpisodeNumber.Value.Substring(episodeIndex + 1, 2), out short episodeNumber))
                                {
                                    if (episodeNumber != 0)
                                    {
                                        Episode = Show.Episodes.SingleOrDefault(e => e.SeriesNumber == seriesNumber && e.Number == episodeNumber && e.SiteSection == SiteSection.TV).DeepClone();
                                    }
                                    else
                                    {
                                        Episode = Show.Episodes.OrderByDescending(e => e.Name.Length).FirstOrDefault(e => e.SeriesNumber == seriesNumber && fileName.ToLower().Contains(e.Name.ToLower()) && e.SiteSection == SiteSection.TV).DeepClone();
                                    }

                                    if (Episode != null)
                                    {
                                        Episode.FilePath = Path;
                                        Episode.InCloud = InCloud;
                                        Episode.DurationSeconds = DurationSeconds;
                                    }
                                }
                                Show.Episodes = new();
                            }
                        }
                    }
                }
                else if (FileType == SiteSection.YouTube)
                {
                    if (fileName.IsVideoFile())
                    {
                        foreach (ShowModel show in shows.Where(s => s.SiteSection == SiteSection.YouTube))
                        {
                            Episode = show.Episodes.FirstOrDefault(e => fileName.Contains(e.Id)).DeepClone();
                            if (Episode != null)
                            {
                                Episode.FilePath = Path;
                                Episode.InCloud = InCloud;
                                Episode.DurationSeconds = DurationSeconds;
                                Show = show.DeepClone();
                                Show.Episodes = new();
                                return;
                            }
                        }
                    }
                }
                else if (FileType == SiteSection.Movies)
                {
                    if (fileName.IsVideoFile())
                    {
                        foreach (ShowModel show in shows.Where(s => s.SiteSection == SiteSection.Movies))
                        {
                            Episode = show.Episodes.FirstOrDefault(e => e.AirDate != null && fileName.Contains(e.Name) && fileName.Contains(((DateTime)e.AirDate).Year.ToString())).DeepClone();
                            if (Episode != null)
                            {
                                Episode.FilePath = Path;
                                Episode.InCloud = InCloud;
                                Episode.DurationSeconds = DurationSeconds;
                                Show = show.DeepClone();
                                Show.Episodes = new();
                                return;
                            }
                        }
                    }
                }
                else
                {
                    throw new NotImplementedException();
                }
            }
        }

        public bool FixUnwatchedTag(string tagName)
        {
            if (Tags.Contains(tagName) && Episode?.WatchStatus == WatchedStatus.EveryoneWatched)
            {
                Tags.Remove(tagName);
                return true;
            }
            if (!Tags.Contains(tagName) && Episode?.WatchStatus != WatchedStatus.EveryoneWatched)
            {
                Tags.Add(tagName);
                return true;
            }

            return false;
        }

        public bool ShouldDelete()
        {
            return Show?.DeleteWatched == true
                && (
                    (Episode?.WatchStatus == WatchedStatus.EveryoneWatched && Episode.Users.Max(u => u.Watched) < DateTime.Now.AddDays(-7))
                    || Episode?.Skip == true
                );
        }

    }

    [ExportFor(GasparType.TypeScript)]
    public class DownloadableFile
    {
        [JsonIgnore]
        public ShowModel? Show { get; set; } = null;
        [JsonIgnore]
        public EpisodeModel? Episode { get; set; } = null;

        public SiteSection? Section => Show?.SiteSection;
        public string? ShowName => Show?.Name;
        public string? EpisodeName => Episode?.Name;
        public string? SeriesEpisodeNumber => Episode?.SeriesEpisodeNumber;

        public string DestinationFolder => $"/{Show?.SortableName}" + (Section == SiteSection.TV ? $"/Series {Episode?.SeriesNumber}" : "");

        public DownloadableFile() { }

        public DownloadableFile(ShowModel? show, EpisodeModel? episode)
        {
            Show = show;
            Episode = episode;
        }

        public string GetFileName(SearchEngineTorrent torrent)
        {
            string? videoFile = torrent.GetVideoFile();
            string torrentName = (videoFile == null) ? torrent.Name : torrent.Name.Replace("." + videoFile.Extension(), "");
            string extension = (videoFile == null) ? "" : "." + videoFile.Extension();

            return GetFileName(torrentName, extension);
        }

        public string GetFileName(Uri uri)
        {
            string filename = uri.IsFile ? System.IO.Path.GetFileName(uri.LocalPath) : uri.LocalPath;
            return GetFileName(filename, "");
        }

        private string GetFileName(string name, string extension)
        {
            if (Episode == null)
            {
                return "";
            }

            string? episodeName = Episode.Name.Replace("/", "-");
            string year = Episode.AirDate == null ? "" : ((DateTime)Episode.AirDate).Year.ToString();

            switch (Episode.SiteSection)
            {
                case SiteSection.TV:
                    return $"{ShowName} {Episode.SeriesEpisodeNumber} - {episodeName} ({name}){extension}";
                case SiteSection.YouTube:
                    return $"{ShowName} {Episode.AirDate?.ToString("yyyy-MM-dd") ?? ""} - {episodeName.Replace("\"", "")} ({Episode.Id}){extension}";
                case SiteSection.Movies:
                    return $"{Episode.Number:D2} - {Episode.Name} ({Episode.Certificate}) {year} ({name}){extension}";
                default:
                    throw new NotImplementedException();
            }
        }
    }

    [ExportFor(GasparType.TypeScript)]
    public class ClientTorrent : DownloadableFile
    {
        public List<SearchEngineTorrent>? Torrents { get; set; } = null;
        public bool StrippedSpecialChars { get; set; }
        public int BaseTorrentCount { get; set; }

        public List<string> DestinationFileNames => Torrents?.Select(t => GetFileName(t)).ToList() ?? [];
        public List<string?> VideoFiles => Torrents?.Select(t => t.GetVideoFile()).ToList() ?? [];

        public ClientTorrent() { }

        public ClientTorrent(ShowModel show, EpisodeModel episode) : this(show, episode, [], false, 0) { }
        public ClientTorrent(ShowModel? show, EpisodeModel episode, List<SearchEngineTorrent>? torrents, bool strippedQuotes, int baseTorrentCount) : base(show, episode)
        {
            Torrents = torrents;
            StrippedSpecialChars = strippedQuotes;
            BaseTorrentCount = baseTorrentCount;
        }

        public Torrent DbTorrent(SearchEngineTorrent torrent)
        {
            if (Episode == null)
            {
                throw new Exception();
            }

            return new()
            {
                EpisodeId = Episode.Id,
                SiteSection = Episode.SiteSection,
                Hash = torrent.Hash,
                Name = torrent.Name,
                Added = DateTime.Now,
                LastPercentage = 0,
                ManuallyAdded = false,
            };
        }

        public void MatchEpisode(List<ShowModel> shows)
        {
            foreach (ShowModel show in shows)
            {
                foreach (EpisodeModel episode in show.Episodes)
                {
                    if (episode.Torrents.Select(t => t.Hash.ToUpper()).Intersect(Torrents?.Select(t => t.Hash.ToUpper()) ?? []).Any())
                    {
                        Show = show.DeepClone();
                        Episode = episode.DeepClone();
                    }
                }
            }
        }

        public bool ShouldDelete()
        {
            return Show == null || Episode == null || Episode.FilePath != null || Episode.WatchStatus == WatchedStatus.EveryoneWatched || Episode.Skip;
        }
    }

    [ExportFor(GasparType.TypeScript)]
    public class ClientWebFile : DownloadableFile
    {
        public string Url { get; set; }
        public string DestinationFileName => GetFileName(new Uri(Url));

        public ClientWebFile(ShowModel show, EpisodeModel episode): base(show, episode)
        {
            Url = $"https://www.youtube.com/watch?v={episode.Id}";
        }
    }

    [ExportFor(GasparType.TypeScript)]
    public class ClientActions
    {
        public string? Error { get; set; } = null;
        public List<ClientTorrent> DeleteTorrents { get; set; } = new();
        public List<ClientTorrent> SaveAndDeleteTorrents { get; set; } = new();
        public List<ClientTorrent> AddTorrents { get; set; } = new();
        public List<ClientWebFile> Downloads { get; set; } = new();
        public List<ClientFile> DeleteFiles { get; set; } = new();
        public List<ClientFile> ReTagFiles { get; set; } = new();
        public List<EpisodeModel> DownloadFileFromCloud { get; set; } = new();
    }
}