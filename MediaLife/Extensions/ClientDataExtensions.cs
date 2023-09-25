using System;
using System.Collections.Generic;
using MediaLife.Models;

namespace MediaLife.Extensions
{
	public static class ClientDataExtensions
	{
        public static string ToStringList(this List<ClientFile> files, bool withTags = false)
        {
            string returnString = "";
            foreach (ClientFile file in files)
            {
                returnString += file.Path;
                if (withTags)
                {
                    returnString += "\t" + string.Join(",", file.Tags);
                }
                returnString += "\n";
            }
            return returnString;
        }

        public static string ToStringList(this List<ClientTorrent> torrents, bool withFileLocations = false)
        {
            string returnString = "";
            foreach (ClientTorrent torrent in torrents)
            {
                returnString += torrent.Hash;
                if (withFileLocations)
                {
                    returnString += "\t" + (torrent.VideoFile ?? "");
                    returnString += "\t" + torrent.DestinationFolder;
                    returnString += "\t" + torrent.DestinationFileName;
                }
                returnString += "\n";
            }
            return returnString;
        }
    }
}

