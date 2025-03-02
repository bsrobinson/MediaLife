using System;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(UserId), nameof(EpisodeId), nameof(SiteSection))]
    public class UserEpisode
    {
        public uint UserId { get; set; }

        [MaxLength(50)]
        public required string EpisodeId { get; set; }

        [DataType("uint")]
        public required SiteSection SiteSection { get; set; }

        public DateTime? Watched { get; set; }

        public DateTime? StartedWatching { get; set; }
    }
}