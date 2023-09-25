
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace MediaLife.Models
{
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class VLCPlaylist
    {
        public List<VLCPlaylist_List> Children { get; set; } = new();
    }

    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class VLCPlaylist_List
    {
        public List<VLCPlaylist_Leaf> Children { get; set; } = new();
    }

    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class VLCPlaylist_Leaf
    {
        public string? Uri { get; set; }
        public int Duration { get; set; }

    }
}
