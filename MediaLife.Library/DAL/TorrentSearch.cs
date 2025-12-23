using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(Id))]
    public class TorrentSearchEngine
    {
        public uint Id { get; set; }

        [MaxLength(1024)]
        public required string Url { get; set; }

        public required bool Active { get; set; }

        public required int ConsecutiveErrors { get; set; }

        public DateTime? LastError { get; set; }

        public DateTime? LastSuccess { get; set; }

        public required int ResultsInLastRun { get; set; }

        [Column(TypeName = "nvarchar(12)")]
        public TorrentSearchEngineType Type { get; set; }

    }

    [ExportFor(GasparType.TypeScript)]
    public enum TorrentSearchEngineType
    {
        PirateBay,
        Knaben,
    }
}