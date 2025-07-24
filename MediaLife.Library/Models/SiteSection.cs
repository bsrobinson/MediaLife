using System.Runtime.Serialization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class ShowModelContext
    {
        public PageType PageType { get; set; }

        public ShowModelContext(PageType page)
        {
            PageType = page;
        }
    }

    [ExportFor(GasparType.TypeScript)]
    [JsonConverter(typeof(StringEnumConverter), typeof(CamelCaseNamingStrategy))]
    public enum SiteSection
    {
        [EnumMember(Value = "lists")]
        Lists = 1,
        [EnumMember(Value = "tv")]
        TV = 10,
        [EnumMember(Value = "youtube")]
        YouTube = 15,
        [EnumMember(Value = "movies")]
        Movies = 20,
        [EnumMember(Value = "books")]
        Books = 30,
        [EnumMember(Value = "radio")]
        Radio = 40,
        [EnumMember(Value = "podcast")]
        Podcast = 45,
    }

    [ExportFor(GasparType.TypeScript)]
    [JsonConverter(typeof(StringEnumConverter), typeof(CamelCaseNamingStrategy))]
    public enum PageType
    {
        [EnumMember(Value = "shows")]
        Shows,
        [EnumMember(Value = "search")]
        Search
    }
}
