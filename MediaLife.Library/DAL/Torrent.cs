using System;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(Id))]
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class Torrent
    {
        public required uint Id { get; set; }
        [Required]
        public uint EpisodeId { get; set; }
        [Required]
        [DataType("uint")]
        public SiteSection SiteSection { get; set; }
        [MaxLength(255)]
        public required string Hash { get; set; }
        [MaxLength(1024)]
        public required string Name { get; set; }
        public required DateTime Added { get; set; }
        [Required]
        public uint LastPercentage { get; set; }
        public required bool ManuallyAdded { get; set; }
    }
}
