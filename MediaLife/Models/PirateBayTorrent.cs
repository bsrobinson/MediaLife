using System;
using MediaLife.Library.DAL;

namespace MediaLife.Models
{
    public class PirateBayTorrent
    {
        public string info_hash { get; set; } = "";
        public string name { get; set; } = "";

        public Torrent DbTorrent(EpisodeModel episode)
        {
            return new Torrent()
            {
                EpisodeId = episode.Id,
                SiteSection = episode.SiteSection,
                Hash = info_hash,
                Name = name,
                Added = DateTime.Now,
                LastPercentage = 0,
            };
        }
    }
}
