using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    public class ListEntry
    {
        [Key]
        public required uint ListId { get; set; }
        [Key]
        public required uint EpisodeId { get; set; }
        [Key]
        public required SiteSection SiteSection { get; set; }
        public required short Rank { get; set; }
    }
}
