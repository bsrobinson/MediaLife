using System;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using Microsoft.EntityFrameworkCore;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(EpisodeId), nameof(SiteSection))]
    public class Episode
    {
        public required uint EpisodeId { get; set; }
        [DataType("uint")]
        public required SiteSection SiteSection { get; set; }
        public required uint ShowId { get; set; }
        public required short SeriesNumber { get; set; }
        public required short Number { get; set; }
        [MaxLength(255)]
        public required string Name { get; set; }
        public DateTime? AirDate { get; set; }
        [MaxLength(2014)]
        public string? Poster { get; set; }
        [MaxLength(10)]
        public string? Certificate { get; set; }
        [MaxLength(255)]
        public string? Author { get; set; }
        public DateTime? StartedWatching { get; set; }
        public DateTime? Watched { get; set; }
        public required bool Skip { get; set; }
        [MaxLength(1024)]
        public string? FilePath { get; set; }
        public required bool RequestDownload { get; set; }
    }
}
