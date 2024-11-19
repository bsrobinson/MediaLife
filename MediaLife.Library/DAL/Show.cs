using System;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(ShowId), nameof(SiteSection))]
    public class Show
    {
        [MaxLength(50)]
        public required string ShowId { get; set; }

        [DataType("uint")]
        public required SiteSection SiteSection { get; set; }

        [MaxLength(255)]
        public required string Name { get; set; }

        [MaxLength(1024)]
        public string? Poster { get; set; }

        public uint? NetworkId { get; set; }

        public required DateTime Updated { get; set; }



        public required DateTime Added { get; set; }

        [MaxLength(100)]
        public string? RecommendedBy { get; set; }

        public required bool DeleteWatched { get; set; }

        public required bool WatchFromNextPlayable { get; set; }

        public required bool DownloadAllTogether { get; set; }

        public int? DownloadLimit { get; set; }

        public required bool KeepAllDownloaded { get; set; }

        public required bool ShowEpisodesAsThumbnails { get; set;}


        public required bool HideWatched { get; set; }

        public required bool HideUnplayable { get; set; }

    }
}