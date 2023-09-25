using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    public class Show
    {
        [Key]
        [Required]
        public uint ShowId { get; set; }
        [Key]
        [Required]
        public SiteSection SiteSection { get; set; }
        [MaxLength(255)]
        public required string Name { get; set; }
        [MaxLength(1024)]
        public string? Poster { get; set; }
        public uint? NetworkId { get; set; }
        public DateTime Added { get; set; }
        [MaxLength(100)]
        public string? RecommendedBy { get; set; }
        public DateTime Updated { get; set; }
        public bool DeleteWatched { get; set; }
        public bool WatchFromNextPlayable { get; set; }
        public bool DownloadAllTogether { get; set; }
        public int? DownloadLimit { get; set; }
    }
}
