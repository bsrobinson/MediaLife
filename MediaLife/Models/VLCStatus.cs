
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class VLCStatus
    {
        public string State { get; set; } = "stopped";
        public int Time { get; set; }
        public int Length { get; set; }
        public float Position { get; set; }
        public bool Fullscreen { get; set; }
        public VLC_Information? Information { get; set; }

        public ShowModel? Show { get; set; }
    }

    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class VLC_Information
    {
        public VLC_Category? Category { get; set; }
    }

    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class VLC_Category
    {
        public VLC_Meta? Meta { get; set; }
    }

    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class VLC_Meta
    {
        public string? Filename { get; set; }
    }
}
