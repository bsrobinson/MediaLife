using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(Id))]
    [ExportFor(GasparType.TypeScript)]
    public class PirateBay
    {
        public uint Id { get; set; }
        [MaxLength(1024)]
        public required string Url { get; set; }
        public required bool Active { get; set; }
        [Required]
        public int ConsecutiveErrors { get; set; }
        public DateTime? LastError { get; set; }
        public DateTime? LastSuccess { get; set; }
        public required int ResultsInLastRun { get; set; }
    }
}
