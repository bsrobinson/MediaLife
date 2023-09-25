using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using Force.DeepCloner;
using MediaLife.Extensions;
using MediaLife.Library.DAL;
using MediaLife.Library.Models;
using MediaLife.Models;

namespace MediaLife.Services
{
    public class ClientService
    {
        private MySqlContext db;
        private Guid SessionId;

        public ClientService(MySqlContext context, Guid? sessionId = null)
        {
            db = context;
            SessionId = sessionId ?? Guid.NewGuid();
        }


        public void LogClientData(ClientData clientData, string label)
        {
            db.Log(SessionId, $"{label} {clientData.Files.Count} Files");
            db.Log(SessionId, $"{label} {clientData.Torrents.Count} Torrents");
        }
        public void LogError(string error)
        {
            db.Log(SessionId, error, true);
        }
        public void LogDisabled()
        {
            db.Log(SessionId, "Update is Disabled");
        }
        public void LogReceivedPayload(string payload)
        {
            db.LogPayloadReceived(payload);
        }
        public void LogReplyPayload(string payload)
        {
            db.LogPayloadReply(payload);
        }


        public string TorrentsToDelete(ref ClientData clientData)
        {
            List<ClientTorrent> returnTorrents = new();
            for (int i = clientData.Torrents.Count - 1; i >= 0; i--)
            {
                if (clientData.Torrents[i].ShouldDelete())
                {
                    returnTorrents.Add(clientData.Torrents[i].DeepClone());
                    db.Log(SessionId, $"Request Delete Torrent: {clientData.Torrents[i].Hash} - {clientData.Torrents[i].TorrentName}");
                    clientData.Torrents.RemoveAt(i);
                }
            }
            return returnTorrents.ToStringList();
        }

        public string TorrentsToSave(SiteSection section, ref ClientData clientData)
        {
            List<ClientTorrent> returnTorrents = new();
            foreach (ClientTorrent torrent in clientData.Torrents.Where(t => t.Episode?.SiteSection == section))
            {
                if (torrent.PercentComplete == 100)
                {
                    returnTorrents.Add(torrent.DeepClone());
                    db.Log(SessionId, $"Request Save {section} Torrent: {torrent.Hash} - {torrent.TorrentName} - {torrent.DestinationFileName}");
                }
            }
            return returnTorrents.ToStringList(withFileLocations: true);
        }

        public string TorrentsToAdd(List<ShowModel> shows, ref ClientData clientData)
        {
            string returnHashes = "";

            PirateBay? piratebay = db.Piratebay.FirstOrDefault(p => p.Active);
            if (piratebay != null)
            {
                List<Task<ClientTorrent?>> torrentTasks = new();

                foreach (ShowModel show in shows)
                {
                    if (show.Episodes.Count(e => e.HasTorrests) == 0)
                    {
                        List<EpisodeModel> missingFiles = show.Unwatched.Where(e => e.FilePath == null).ToList();
                        if (missingFiles.Count > 0 && (show.DownloadLimit == null || show.UnwatchedCount - missingFiles.Count < show.DownloadLimit))
                        {
                            torrentTasks.Add(SearchForTorrent(piratebay, show, missingFiles.First()));
                            if (show.DownloadAllTogether)
                            {
                                foreach (EpisodeModel episode in missingFiles.Skip(1))
                                {
                                    torrentTasks.Add(SearchForTorrent(piratebay, show, episode));
                                }
                            }
                        }
                    }
                }
                if (torrentTasks.Count > 0)
                {
                    //Test search; error if no results
                    torrentTasks.Add(SearchForTorrent(piratebay, null, new()));
                }

                int errorsBeforeRun = piratebay.ConsecutiveErrors;
                DateTime? lastSuccessBeforeRun = piratebay.LastSuccess;

                int totalResultCount = 0;
                int? testRunCount = null;
                while (torrentTasks.Any())
                {
                    Task<ClientTorrent?> finishedTask = Task.WhenAny(torrentTasks).Result;
                    torrentTasks.Remove(finishedTask);

                    ClientTorrent? torrent = finishedTask.Result;
                    if (torrent != null && torrent.Show != null && torrent.Episode != null)
                    {
                        if (torrent.TorrentResultCount == 0 && (Regex.Match(torrent.Show.Name, "[^A-Za-z0-9\\s]").Success || Regex.Match(torrent.Episode.Name, "[^A-Za-z0-9\\s]").Success) && !torrent.StrippedSpecialChars)
                        {
                            torrentTasks.Add(SearchForTorrent(piratebay, torrent.Show, torrent.Episode, true));
                        }

                        if (torrent.Show != null && !string.IsNullOrEmpty(torrent.Hash))
                        {
                            db.Torrents.Add(torrent.DbTorrent());
                            clientData.Torrents.Add(torrent);
                            returnHashes += torrent.Hash + "\t" + torrent.TorrentName + "\n";
                            db.Log(SessionId, $"Request Add Torrent: {torrent.Hash} - {torrent.TorrentName}");
                        }

                        if (torrent.TorrentResultCount != null)
                        {
                            piratebay.ConsecutiveErrors = 0;
                            piratebay.LastSuccess = DateTime.Now;
                            totalResultCount += (int)torrent.TorrentResultCount;
                            if (torrent.Show == null) { testRunCount = torrent.TorrentResultCount; }
                        }
                        else
                        {
                            piratebay.ConsecutiveErrors++;
                            piratebay.LastError = DateTime.Now;
                        }
                    }
                }

                if (testRunCount == 0 && totalResultCount == 0)
                {
                    piratebay.ConsecutiveErrors = errorsBeforeRun + 1;
                    piratebay.LastSuccess = lastSuccessBeforeRun;
                    piratebay.LastError = DateTime.Now;
                }
                piratebay.ResultsInLastRun = totalResultCount;
                db.SaveChanges();

                db.Log(SessionId, $"Found {totalResultCount} (incl. {testRunCount} test) results when searching Pirate Bay");
            }
            else
            {
                db.Log(SessionId, "No active Pirate Bay entries");
            }

            //Add manual torrents
            foreach (Torrent torrent in db.Torrents.Where(t => t.ManuallyAdded))
            {
                returnHashes += torrent.Hash + "\t" + torrent.Name + "\n";
            }

            return returnHashes;
        }

        public async Task<ClientTorrent?> SearchForTorrent(PirateBay piratebay, ShowModel? show, EpisodeModel episode, bool stripSpecialChars = false)
        {
            try
            {
                string? search = "back"; //test search
                if (show != null)
                {
                    string showName = show.Name;
                    string episodeName = episode.Name;
                    if (stripSpecialChars)
                    {
                        showName = Regex.Replace(showName, @"[^A-Za-z0-9\s]", "");
                        episodeName = Regex.Replace(episodeName, @"[^A-Za-z0-9\s]", "");
                    }
                    switch (episode.SiteSection)
                    {
                        case SiteSection.TV:
                            search = showName + " " + (episode.Number == 0 ? episodeName : episode.SeriesEpisodeNumber);
                            break;
                        case SiteSection.Movies:
                            if (episode.AirDate != null)
                            {
                                search = episodeName + " " + ((DateTime)episode.AirDate).Year;
                            }
                            break;
                        default:
                            search = null;
                            break;
                    }
                }

                if (search != null)
                {
                    HttpClient httpClient = new();
                    List<PirateBayTorrent>? torrents = (await httpClient.GetFromJsonAsync<List<PirateBayTorrent>>($"{piratebay.Url}{HttpUtility.UrlEncode(search)}"))?.ToList();
                    if (torrents == null)
                    {
                        return null;
                    }

                    PirateBayTorrent? torrent = torrents.First();

                    if (torrent.info_hash == "0000000000000000000000000000000000000000")
                    {
                        torrents.Remove(torrent);
                        torrent = null;
                    }
                    else
                    {
                        episode.Torrents.Add(torrent.DbTorrent(episode));
                    }

                    return new ClientTorrent(show, episode, torrent, torrents.Count, stripSpecialChars);
                }
                return null;
            }
            catch
            {
                return new ClientTorrent(show, episode, null, null, stripSpecialChars);
            }            
        }


        public string FilesToReTag(ClientData clientData)
        {
            List<ClientFile> returnFiles = new();
            if (clientData.UnwatchedTag != null)
            {
                foreach (ClientFile file in clientData.Files)
                {
                    if (file.FixUnwatchedTag(clientData.UnwatchedTag))
                    {
                        returnFiles.Add(file.DeepClone());
                        db.Log(SessionId, $"Request Re-Tag: {file.Path} - {string.Join(",", file.Tags)}");
                    }
                }
            }
            return returnFiles.ToStringList(withTags: true);
        }

        public string FilesToDelete(ref ClientData clientData)
        {
            List<ClientFile> returnFiles = new();
            for (int i = clientData.Files.Count - 1; i >= 0; i--)
            {
                if (clientData.Files[i].ShouldDelete())
                {
                    returnFiles.Add(clientData.Files[i].DeepClone());
                    db.Log(SessionId, $"Request Delete: {clientData.Files[i].Path}");
                    clientData.Files.RemoveAt(i);
                }
            }
            return returnFiles.ToStringList();
        }

        public string FilesToDownloadFromCloud(ClientData clientData)
        {
            List<string> paths = new();
            foreach (ClientFile file in clientData.Files.Where(f => f.Episode?.RequestDownload == true))
            {
                if (file.Episode?.FilePath != null)
                {
                    paths.Add(file.Episode.FilePath);
                    db.Log(SessionId, $"Request Download from Cloud: {file.Episode.FilePath}");
                }
            }
            return string.Join("\n", paths);
        }


        public void UpdateFilePaths(List<ClientFile> files, List<EpisodeModel> dbEpisodes)
        {
            //Remove file paths not on the client
            foreach (string? path in dbEpisodes.Select(e => e.FilePath).Except(files.Select(f => f.Path)))
            {
                if (!string.IsNullOrEmpty(path))
                {
                    db.Episodes.First(e => e.FilePath == path).FilePath = null;
                }
            }

            foreach (ClientFile file in files)
            {
                if (file.Episode != null)
                {
                    EpisodeModel? dbEpisode = dbEpisodes.SingleOrDefault(e => e.Id == file.Episode.Id && e.SiteSection == file.FileType);
                    if (dbEpisode != null)
                    {
                        //Add client file paths
                        if (dbEpisode.FilePath != file.Episode.FilePath)
                        {
                            db.Episodes.Single(e => e.EpisodeId == dbEpisode.Id && e.SiteSection == file.FileType).FilePath = file.Episode.FilePath;
                            dbEpisode.FilePath = file.Episode.FilePath;
                        }

                        //Remove completed download requests
                        if (dbEpisode.inCloud == false && dbEpisode.RequestDownload)
                        {
                            db.Episodes.Single(e => e.EpisodeId == dbEpisode.Id && e.SiteSection == dbEpisode.SiteSection).RequestDownload = false;
                        }
                    }
                }
            }

            db.SaveChanges();
        }

        public void UpdateTorrentReferences(List<ClientTorrent> clientTorrents)
        {
            List<string> clientHashes = clientTorrents.Select(t => t.Hash.ToUpper()).ToList();
            
            //Remove torrent references not on the client
            foreach (Torrent torrent in db.Torrents.Where(t => !clientHashes.Contains(t.Hash.ToUpper()) && !t.ManuallyAdded))
            {
                db.Torrents.Remove(torrent);
            }

            //Clear manually added flag for torrent references on the client
            foreach (Torrent torrent in db.Torrents.Where(t => clientHashes.Contains(t.Hash.ToUpper()) && t.ManuallyAdded))
            {
                torrent.ManuallyAdded = false;
            }

            db.SaveChanges();
        }
    }
}
