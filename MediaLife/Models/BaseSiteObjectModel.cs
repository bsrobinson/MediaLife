using MediaLife.Library.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class BaseSiteObjectModel
    {
        public string Id { get; set; } = "";
        public SiteSection SiteSection { get; set; }
        public string Name { get; set; } = "";
    }
}
