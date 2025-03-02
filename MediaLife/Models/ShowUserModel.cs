using System;
using System.Diagnostics.CodeAnalysis;
using MediaLife.Library.DAL;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class ShowUserModel
    {
        public uint Id { get; set; }
        public required string Name { get; set; }
        public bool Me { get; set; }
        public bool HasAdded { get; set; }
    }

    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class EpisodeUserModel : ShowUserModel
    {
        public DateTime? Watched { get; set; }

        [JsonConstructor]
        public EpisodeUserModel() { }

        [SetsRequiredMembers]
        public EpisodeUserModel(ShowUserModel showUser, UserEpisode? episodeUser)
        {
            Id = showUser.Id;
            Name = showUser.Name;
            Me = showUser.Me;
            HasAdded = showUser.HasAdded;
            Watched = episodeUser?.Watched;
        }
    }
}