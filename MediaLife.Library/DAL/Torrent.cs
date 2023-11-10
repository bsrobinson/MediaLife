using System;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(Id))]
    public class Torrent
    {
        public uint Id { get; set; }

        public required uint EpisodeId { get; set; }

        [DataType("uint")]
        public required SiteSection SiteSection { get; set; }

        [MaxLength(255)]
        public required string Hash { get; set; }

        [MaxLength(1024)]
        public required string Name { get; set; }

        public required DateTime Added { get; set; }

        public required uint LastPercentage { get; set; }

        public required bool ManuallyAdded { get; set; }

    }
}