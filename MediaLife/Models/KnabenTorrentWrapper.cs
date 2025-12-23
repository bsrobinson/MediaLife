using System.Collections.Generic;
using System.Text.Json.Serialization;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    public class KnabenTorrentWrapper
    {
        [JsonPropertyName("hits")]
        public List<SearchEngineTorrent> Hits { get; set; } = [];
    }
}
