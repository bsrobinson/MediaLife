using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
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

                //remove invaild file and duplicates
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
        public List<string> Tags { get; set; }

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
                            List<string> cleansedfileNames = new() {
                                fileName.Trim(),
                                fileName.Replace(".", " ").Trim(),
                                fileName.Replace("-", " ").Trim(),
                                fileName.Replace(".", "").Replace("-", "").Trim()
                            };
                            IEnumerable<ShowModel> matchingShows = shows.Where(s => cleansedfileNames.Any(n => n.StartsWith(s.Name, true, CultureInfo.CurrentCulture) && s.SiteSection == SiteSection.TV));
                            
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
                                        Episode = Show.Episodes.FirstOrDefault(e => e.SeriesNumber == seriesNumber && fileName.Contains(e.Name) && e.SiteSection == SiteSection.TV).DeepClone();
                                    }

                                    if (Episode != null)
                                    {
                                        Episode.FilePath = Path;
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
            if (Tags.Contains(tagName) && Episode?.Watched != null)
            {
                Tags.Remove(tagName);
                return true;
            }
            if (!Tags.Contains(tagName) && Episode?.Watched == null)
            {
                Tags.Add(tagName);
                return true;
            }

            return false;
        }

        public bool ShouldDelete()
        {
            return Show?.DeleteWatched == true && Episode?.Watched != null && Episode.Watched < DateTime.Now.AddDays(-7);
        }

    }

    [ExportFor(GasparType.FrontEnd)]
    public class ClientTorrent
    {
        public string Hash { get; set; } = "";
        public double PercentComplete { get; set; }
        public List<string> Files { get; set; } = new();

        public ShowModel? Show { get; set; } = null;
        public EpisodeModel? Episode { get; set; } = null;

        public string TorrentName { get; set; } = "";
        public int? TorrentResultCount { get; set; }
        public bool StrippedSpecialChars { get; set; }

        public bool Valid => !string.IsNullOrEmpty(Hash);
        public string DestinationFolder => $"/{Show?.SortableName}" + (Episode?.SiteSection == SiteSection.TV ? $"/Series {Episode.SeriesNumber}" : "");
        public string DestinationFileName => GetFileName();
        public string? VideoFile => GetVideoFile();

        public ClientTorrent() { }

        public ClientTorrent(ShowModel show, EpisodeModel episode) : this(show, episode, null, null, false) { }
        public ClientTorrent(ShowModel? show, EpisodeModel episode, PirateBayTorrent? torrent, int? torrentResultCount, bool strippedQuotes)
        {
            Show = show;
            Episode = episode;
            Hash = torrent?.info_hash ?? "";
            TorrentName = torrent?.name ?? "";
            TorrentResultCount = torrentResultCount;
            StrippedSpecialChars = strippedQuotes;
        }

        public Torrent DbTorrent()
        {
            if (Episode == null)
            {
                throw new Exception();
            }

            return new()
            {
                EpisodeId = Episode.Id,
                SiteSection = Episode.SiteSection,
                Hash = Hash,
                Name = TorrentName,
                Added = DateTime.Now,
                LastPercentage = 0,
                ManuallyAdded = false,
            };
        }

        public string GetFileName()
        {
            if (Episode == null)
            {
                return "";
            }

            string torrentName = (VideoFile == null) ? TorrentName : TorrentName.Replace("." + VideoFile.Extension(), "");
            string extension = (VideoFile == null) ? "" : "." + VideoFile.Extension();
            string? episodeName = Episode?.Name.Replace("/", "-");
            string year = Episode?.AirDate == null ? "" : ((DateTime)Episode.AirDate).Year.ToString();

            switch (Episode?.SiteSection)
            {
                case SiteSection.TV:
                    return $"{Show?.Name} {Episode.SeriesEpisodeNumber} - {episodeName} ({torrentName}){extension}";
                case SiteSection.YouTube:
                    return $"{Show?.Name} - {episodeName} ({Episode.Id}){extension}";
                case SiteSection.Movies:
                    return $"{Episode.Number:D2} - {Episode.Name} ({Episode.Certificate}) {year} ({torrentName}){extension}";
                default:
                    throw new NotImplementedException();
            }
        }

        public string? GetVideoFile()
        {
            List<string> videoFiles = new();

            foreach (string file in Files)
            {
                string? fileName = file.FileName();
                if (fileName != null && !fileName.Contains("sample") && fileName.IsVideoFile())
                {
                    videoFiles.Add(file);
                }
            }

            return videoFiles.Count == 1 ? videoFiles[0] : null;
        }

        public void MatchEpisode(List<ShowModel> shows)
        {
            foreach (ShowModel show in shows)
            {
                foreach (EpisodeModel episode in show.Episodes)
                {
                    if (episode.Torrents.Any(t => t.Hash.ToUpper() == Hash.ToUpper()))
                    {
                        Show = show;
                        Episode = episode;
                    }
                }
            }
        }

        public bool ShouldDelete()
        {
            return Show == null || Episode == null || Episode.FilePath != null || Episode.Watched != null || Episode.Skip;
        }
    }

    [ExportFor(GasparType.TypeScript)]
    public class ClientActions
    {
        public string? Error { get; set; } = null;
        public List<ClientTorrent> DeleteTorrents { get; set; } = new();
        public List<ClientTorrent> SaveAndDeleteTorrents { get; set; } = new();
        public List<ClientTorrent> AddTorrents { get; set; } = new();
        public List<ClientTorrent> Downloads { get; set; } = new();
        public List<ClientFile> DeleteFiles { get; set; } = new();
        public List<ClientFile> RetagFiles { get; set; } = new();
        public List<EpisodeModel> DownloadFileFromCloud { get; set; } = new();
    }
}