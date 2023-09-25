using System;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;

namespace MediaLife.Library.DAL
{
    public class Episode
    {
        [Key]
        public required uint EpisodeId { get; set; }
        [Key]
        public required SiteSection SiteSection { get; set; }
        public required uint ShowId { get; set; }
        public short SeriesNumber { get; set; }
        public short Number { get; set; }
        [MaxLength(255)]
        public required string Name { get; set; }
        public DateTime? AirDate { get; set; }
        [MaxLength(1024)]
        public string? Poster { get; set; }
        [MaxLength(10)]
        public string? Certificate { get; set; }
        [MaxLength(255)]
        public string? Author { get; set; }
        public DateTime? StartedWatching { get; set; }
        public DateTime? Watched { get; set; }
        public bool Skip { get; set; }
        [MaxLength(1024)]
        public string? FilePath { get; set; }
        public bool RequestDownload { get; set; }
    }
}
