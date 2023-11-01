using System;
using System.Collections.Generic;
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
        [Required]
        public uint ShowId { get; set; }
        [Required]
        [DataType("uint")]
        public SiteSection SiteSection { get; set; }
        [MaxLength(255)]
        public required string Name { get; set; }
        [MaxLength(1024)]
        public string? Poster { get; set; }
        public uint? NetworkId { get; set; }
        public required DateTime Added { get; set; }
        [MaxLength(100)]
        public string? RecommendedBy { get; set; }
        public required DateTime Updated { get; set; }
        public required bool DeleteWatched { get; set; }
        public required bool WatchFromNextPlayable { get; set; }
        public required bool DownloadAllTogether { get; set; }
        public int? DownloadLimit { get; set; }
    }
}
