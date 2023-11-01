using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(ListId), nameof(EpisodeId), nameof(SiteSection))]
    public class ListEntry
    {
        public required uint ListId { get; set; }
        public required uint EpisodeId { get; set; }
        [DataType("uint")]
        public required SiteSection SiteSection { get; set; }
        public required ushort Rank { get; set; }
    }
}
