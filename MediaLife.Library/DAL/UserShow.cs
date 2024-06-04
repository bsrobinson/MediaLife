using System;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using Microsoft.EntityFrameworkCore;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(UserId), nameof(ShowId))]
    public class UserShow
    {
        public uint UserId { get; set; }

        public uint ShowId { get; set; }

        [DataType("uint")]
        public required SiteSection SiteSection { get; set; }

        public required DateTime Added { get; set; }

        [MaxLength(100)]
        public string? RecommendedBy { get; set; }

        public required bool DeleteWatched { get; set; }

        public required bool WatchFromNextPlayable { get; set; }

        public required bool DownloadAllTogether { get; set; }

        public int? DownloadLimit { get; set; }

        public required bool KeepAllDownloaded { get; set; }
    }
}