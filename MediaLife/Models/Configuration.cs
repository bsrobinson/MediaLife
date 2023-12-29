using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using MediaLife.Library.Models;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    public interface IConfiguration { }

    [ExportFor(GasparType.TypeScript)]
    public class Configuration : IConfiguration
    {
        ///<summary>Number of days to keep in the log</summary>
        [DefaultValue((ushort)7), DisplayName("Log Days")]
        public ushort LogDays { get; set; }

        public UserConfig UserConfig { get; set; } = new();
    }

    [ExportFor(GasparType.TypeScript)]
    public class UserConfig : IConfiguration
    {
        ///<summary>Allow updates requests from client</summary>
        [DefaultValue(true), DisplayName("Client Update Enabled")]
        public bool ClientUpdateEnabled { get; set; }

        ///<summary>If the number of files provided by the client, compared to the number of files recorded in the database, drop below this % threshold; the files will not be processed, and an error thrown</summary>
        [DefaultValue((ushort)80), Range(0, 100), DisplayName("Client File Threshold (%)")]
        public ushort ClientFileThresholdPercent{ get; set; }

        public TVConfig TVConfig { get; set; } = new();
        public YouTubeConfig YouTubeConfig { get; set; } = new();
        public MovieConfig MovieConfig { get; set; } = new();
        public BookConfig BookConfig { get; set; } = new();

        public VLCConfig VLCConfig { get; set; } = new();

        public SectionConfig SectionConfig(SiteSection section)
        {
            switch (section)
            {
                case SiteSection.TV: return TVConfig;
                case SiteSection.YouTube: return YouTubeConfig;
                case SiteSection.Movies: return MovieConfig;
                case SiteSection.Books: return BookConfig;
                case SiteSection.Lists: return new SectionConfig();
                default:
                    throw new NotImplementedException($"Cannot get config for '{section}' section");
            }
        }
    }

    [ExportFor(GasparType.TypeScript)]
    public class SectionConfig : IConfiguration
    {
        ///<summary>Update from data provider with client requests</summary>
        [DefaultValue(true)]
        public bool UpdateFromDataProvider { get; set; }

        ///<summary>Request watched files are deleted</summary>
        [DefaultValue(false)]
        public bool DeleteWatched { get; set; }

        ///<summary>Limit download to this number of file, unlimited if null</summary>
        [DefaultValue(null)]
        public ushort? DownloadLimit { get; set; }

        ///<summary>Automatically request next episodes from the cloud</summary>
        [DefaultValue(false)]
        public bool KeepNextEpisodeOffCloud { get; set; }
    } 

    [ExportFor(GasparType.TypeScript)]
    public class TVConfig : SectionConfig { }
    
    [ExportFor(GasparType.TypeScript)]
    public class YouTubeConfig : SectionConfig { }

    [ExportFor(GasparType.TypeScript)]
    public class MovieConfig : SectionConfig 
    { 
        ///<summary>API Key for TheMovieDB</summary>
        [DefaultValue(null), DisplayName("TheMovieDb Api Key")]
        public string? TheMovieDbApiKey { get; set; }
        
        ///<summary>Country code used for movie release date</summary>
        [DefaultValue("GB"), DisplayName("Country Code")]
        public string? MovieReleaseCountryCode { get; set; }        
    }

    [ExportFor(GasparType.TypeScript)]
    public class BookConfig : SectionConfig { }

    [ExportFor(GasparType.TypeScript)]
    public class VLCConfig : IConfiguration
    {
        ///<summary>Address of VLC server, if null VLC feature will be disabled</summary>
        [DefaultValue(null)]
        public string? Address { get; set; }

        ///<summary>VLC server password</summary>
        [DefaultValue(null)]
        public string? Password { get; set; }
    }
}