using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using MediaLife.Extensions;
using MediaLife.Library.DAL;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    public class PirateBayTorrent
    {
        [JsonPropertyName("info_hash")]
        public string Hash { get; set; } = "";

        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        public double PercentComplete { get; set; } = 0;
        public List<string> Files { get; set; } = [];

        public Torrent DbTorrent(EpisodeModel episode)
        {
            return new Torrent()
            {
                EpisodeId = episode.Id,
                SiteSection = episode.SiteSection,
                Hash = Hash,
                Name = Name,
                Added = DateTime.Now,
                LastPercentage = 0,
                ManuallyAdded = false,
            };
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
    }
}
