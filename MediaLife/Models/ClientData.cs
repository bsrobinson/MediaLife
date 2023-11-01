using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using Force.DeepCloner;
using MediaLife.Extensions;
using MediaLife.Library.DAL;
using MediaLife.Library.Models;

namespace MediaLife.Models
{
    public class ClientData
    {
        public string? UnwatchedTag { get; set; }

        public List<ClientFile> Files { get; set; }
        public List<ClientTorrent> Torrents { get; set; }

        public bool Valid => HasFiles && HasTorrents;
        private bool HasFiles = false;
        private bool HasTorrents = false;

        public ClientData(string postedData)
        {
            UnwatchedTag = null;

            Files = new();
            Torrents = new();

            string activeGroup = "";
            string activeSubGroup = "";
            foreach (string line in postedData.Split("\n"))
            {
                if (line.StartsWith("START_GROUP:"))
                {
                    activeGroup = line.Substring(12);
                    activeSubGroup = "";
                    if (activeGroup.StartsWith("FILES:"))
                    {
                        activeSubGroup = activeGroup.Substring(6);
                        activeGroup = "FILES";
                    }
                }
                else
                {
                    if (activeGroup == "SETTINGS")
                    {
                        if (line.StartsWith("UnwatchedTag:")) { UnwatchedTag = line.Substring(13).Trim(); }
                    }
                    if (activeGroup == "FILES")
                    {
                        SiteSection? fileType = null;
                        if (activeSubGroup == "TV") { fileType = SiteSection.TV; }
                        if (activeSubGroup == "MOVIES") { fileType = SiteSection.Movies; }

                        if (fileType != null)
                        {
                            ClientFile file = new((SiteSection)fileType, line);
                            if (file.Valid)
                            {
                                Files.Add(file);
                            }
                            HasFiles = true;
                        }
                    }
                    if (activeGroup == "TORRENTS")
                    {
                        ClientTorrent torrent = new(line);
                        if (torrent.Valid)
                        {
                            Torrents.Add(torrent);
                        }
                        HasTorrents = true;
                    }
                }
            }
        }

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

    public class ClientFile
    {
        public SiteSection FileType { get; set; }

        public string? Path { get; set; }
        public List<string> Tags { get; set; }

        public ShowModel? Show { get; set; }
        public EpisodeModel? Episode { get; set; }

        public bool Valid => !string.IsNullOrEmpty(Path) && Show != null && Episode != null;

        
        public ClientFile(SiteSection fileType, string line)
        {
            FileType = fileType;
            Tags = new();

            List<string> columns = line.Split("\t").ToList();
            if (columns.Count > 0)
            {
                Path = columns[0];
                Show = new();
                Episode = new();
                if (columns.Count > 1)
                {
                    Tags = columns[1].Split(",").ToList();
                }
            }
        }

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
                            string showName = fileName.Substring(0, seriesEpisodeNumber.Index);
                            showName = showName.Replace("-", "").Replace(".", "").Trim();
                            Show = shows.FirstOrDefault(s => string.Compare(showName, s.Name, CultureInfo.CurrentCulture, CompareOptions.IgnoreCase) == 0 && s.SiteSection == SiteSection.TV).DeepClone();

                            if (Show != null)
                            {
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

        public ClientTorrent(string line)
        {
            List<string> columns = line.Split("\t", 4).ToList();
            if (columns.Count == 4)
            {
                Hash = columns[0];
                TorrentName = columns[1];

                double.TryParse(columns[2], out double percent);
                PercentComplete = double.IsNaN(percent) ? 0 : percent;

                if (columns[3].StartsWith("FILE:"))
                {
                    Files = columns[3].Substring(5).Split("FILE:").ToList();
                }
            }
        }

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
            string torrentName = (VideoFile == null) ? TorrentName : TorrentName.Replace("." + VideoFile.Extension(), "");
            string extension = (VideoFile == null) ? "" : "." + VideoFile.Extension();
            string? episodeName = Episode?.Name.Replace("/", "-");
            string year = Episode?.AirDate == null ? "" : ((DateTime)Episode.AirDate).Year.ToString();

            switch (Episode?.SiteSection)
            {
                case SiteSection.TV:
                    return $"{Show?.Name} {Episode.SeriesEpisodeNumber} - {episodeName} ({torrentName}){extension}";
                case SiteSection.Movies:
                    return $"{Episode.Number.ToString("D2")} - {Episode.Name} ({Episode.Certificate}) {year} ({torrentName}){extension}";
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
}