using System;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(UserId), nameof(ShowId), nameof(SiteSection))]
    public class UserShow
    {
        public uint UserId { get; set; }

        [MaxLength(50)]
        public required string ShowId { get; set; }

        [DataType("uint")]
        public required SiteSection SiteSection { get; set; }

        public required DateTime Added { get; set; }

        [MaxLength(100)]
        public string? RecommendedBy { get; set; }

        public required bool WatchFromNextPlayable { get; set; }

        public required bool HideWatched { get; set; }

        public required bool HideUnplayable { get; set; }
    }
}