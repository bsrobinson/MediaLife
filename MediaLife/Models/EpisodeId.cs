using MediaLife.Library.DAL;
using MediaLife.Library.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class EpisodeId
    {
        public string Id { get; set; }
        public SiteSection Section { get; set; }

        public EpisodeId(string id, SiteSection section)
        {
            Id = id;
            Section = section;
        }
    }
}
