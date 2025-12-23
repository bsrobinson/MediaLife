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
        public Guid SessionId { get; set; }

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
        public void LogError(Exception exception, string? messagePrefix = null)
        {
            db.ChangeTracker.Clear();
            db.Log(SessionId, exception, messagePrefix);
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
        public void LogDone()
        {
            db.Log(SessionId, "Done");
        }


        public List<ClientTorrent> TorrentsToDelete(ref ClientData clientData)
        {
            List<ClientTorrent> returnTorrents = new();
            for (int i = clientData.Torrents.Count - 1; i >= 0; i--)
            {
                if (clientData.Torrents[i].ShouldDelete())
                {
                    returnTorrents.Add(clientData.Torrents[i].DeepClone());

                    foreach (PirateBayTorrent torrent in clientData.Torrents[i].Torrents ?? [])
                    {
                        db.Log(SessionId, $"Request Delete Torrent: {clientData.Torrents[i].ShowName} - {clientData.Torrents[i].EpisodeName} ({torrent.Hash} - {torrent.Name})");
                    }
                    
                    clientData.Torrents.RemoveAt(i);
                }
            }
            return returnTorrents;
        }

        public List<ClientTorrent> TorrentsToSave(ref ClientData clientData)
        {
            List<ClientTorrent> returnTorrents = new();
            foreach (ClientTorrent torrent in clientData.Torrents)
            {
                PirateBayTorrent? torrentToSave = torrent.Torrents?.FirstOrDefault(t => t.PercentComplete == 100);
                if (torrentToSave != null)
                {
                    ClientTorrent returnTorrent = torrent.DeepClone();
                    returnTorrent.Torrents = [ torrentToSave.DeepClone() ];

                    returnTorrents.Add(returnTorrent);

                    db.Log(SessionId, $"Request Save {torrent.Section} Torrent: {torrentToSave.Hash} - {torrentToSave.Name} - {torrent.GetFileName(torrentToSave)}");
                }
            }
            return returnTorrents;
        }

        public List<ClientTorrent> TorrentsToAdd(List<ShowModel> shows, ref ClientData clientData)
        {
            List<ClientTorrent> returnTorrents = new();

            PirateBay? pirateBay = db.PirateBay.FirstOrDefault(p => p.Active);
            if (pirateBay != null)
            {
                List<Task<ClientTorrent?>> torrentTasks = new();

                foreach (ShowModel show in shows)
                {
                    List<EpisodeModel> missingFiles = show.Unwatched.Where(e => e.FilePath == null).ToList();
                    if (missingFiles.Count > 0 && (show.DownloadLimit == null || show.Unwatched.Count - missingFiles.Count < show.DownloadLimit))
                    {
                        torrentTasks.Add(SearchForTorrent(pirateBay, show, missingFiles.First()));
                        
                        if (show.DownloadAllTogether)
                        {
                            foreach (EpisodeModel episode in missingFiles.Skip(1))
                            {
                                torrentTasks.Add(SearchForTorrent(pirateBay, show, episode));
                            }
                        }
                    }
                }
                
                if (torrentTasks.Count == 0)
                {
                    //Test search; error if no results
                    torrentTasks.Add(SearchForTorrent(pirateBay, null, new()));
                }

                int errorsBeforeRun = pirateBay.ConsecutiveErrors;
                DateTime? lastSuccessBeforeRun = pirateBay.LastSuccess;

                int totalBaseTorrentCount = 0;
                int totalResultCount = 0;
                int? testRunCount = null;
                while (torrentTasks.Any())
                {
                    Task<ClientTorrent?> finishedTask = Task.WhenAny(torrentTasks).Result;
                    torrentTasks.Remove(finishedTask);

                    ClientTorrent? clientTorrent = finishedTask.Result;
                    if (clientTorrent != null && clientTorrent.Show != null && clientTorrent.Episode != null)
                    {
                        if (clientTorrent.Torrents?.Count == 0 && (Regex.Match(clientTorrent.Show.Name, "[^A-Za-z0-9\\s]").Success || Regex.Match(clientTorrent.Episode.Name, "[^A-Za-z0-9\\s]").Success) && !clientTorrent.StrippedSpecialChars)
                        {
                            torrentTasks.Add(SearchForTorrent(pirateBay, clientTorrent.Show, clientTorrent.Episode, true));
                        }

                        if (clientTorrent.Show != null)
                        {
                            clientData.Torrents.Add(clientTorrent);
                            ClientTorrent returnTorrent = clientTorrent.DeepClone();

                            foreach (PirateBayTorrent torrent in clientTorrent.Torrents ?? [])
                            {
                                if (!string.IsNullOrEmpty(torrent.Hash))
                                {
                                    db.Torrents.Add(clientTorrent.DbTorrent(torrent));
                                    db.Log(SessionId, $"Request Add Torrent: {clientTorrent.ShowName} - {clientTorrent.EpisodeName} ({torrent.Hash} - {torrent.Name})");
                                }
                                else
                                {
                                    returnTorrent.Torrents?.Remove(torrent);
                                }
                            }

                            if (returnTorrent.Torrents?.Any() == true)
                            {
                                returnTorrents.Add(returnTorrent);
                            }
                        }

                        if (clientTorrent.Torrents != null)
                        {
                            pirateBay.ConsecutiveErrors = 0;
                            pirateBay.LastSuccess = DateTime.Now;
                            totalResultCount += clientTorrent.Torrents.Count;
                            totalBaseTorrentCount += clientTorrent.BaseTorrentCount;
                            if (clientTorrent.Show == null) { testRunCount = clientTorrent.Torrents.Count; }
                        }
                        else
                        {
                            pirateBay.ConsecutiveErrors++;
                            pirateBay.LastError = DateTime.Now;
                        }
                    }
                }

                if (testRunCount == 0 && totalBaseTorrentCount == 0)
                {
                    pirateBay.ConsecutiveErrors = errorsBeforeRun + 1;
                    pirateBay.LastSuccess = lastSuccessBeforeRun;
                    pirateBay.LastError = DateTime.Now;
                }
                pirateBay.ResultsInLastRun = totalBaseTorrentCount;
                db.SaveChanges();

                db.Log(SessionId, $"Found {totalBaseTorrentCount} ({totalResultCount} after removing existing) {(testRunCount > 0 ? " (incl. {testRunCount} test) " : "")} results when searching Pirate Bay");
            }
            else
            {
                db.Log(SessionId, "No active Pirate Bay entries");
            }

            //Add manual torrents
            foreach (Torrent torrent in db.Torrents.Where(t => t.ManuallyAdded))
            {
                returnTorrents.Add(new() { Torrents = [ new() { Hash = torrent.Hash, Name = torrent.Name } ] });
            }

            return returnTorrents;
        }

        public List<ClientWebFile> FilesToDownload(List<ShowModel> shows)
        {
            List<ClientWebFile> downloadFiles = new();

            foreach (ShowModel show in shows)
            {
                List<EpisodeModel> missingFiles = show.Unwatched.Where(e => e.FilePath == null && e.SiteSection == SiteSection.YouTube).ToList();
                if (missingFiles.Count > 0 && (show.DownloadLimit == null || show.Unwatched.Count - missingFiles.Count < show.DownloadLimit))
                {
                    downloadFiles.Add(new(show, missingFiles.First()));

                    if (show.DownloadAllTogether)
                    {
                        foreach (EpisodeModel episode in missingFiles.Skip(1))
                        {
                            downloadFiles.Add(new(show, episode));
                        }
                    }
                }
            }

            foreach (ClientWebFile file in downloadFiles)
            {
                db.Log(SessionId, $"Request download of YouTube file - {file.ShowName} - {file.EpisodeName}");
            }
            
            return downloadFiles;
        }

        public async Task<ClientTorrent?> SearchForTorrent(PirateBay pirateBay, ShowModel? show, EpisodeModel episode, bool stripSpecialChars = false)
        {
            bool stalled = false;

            if (episode.HasTorrents)
            {
                uint percentComplete = episode.Torrents.Max(t => t.LastPercentage);
                uint hoursDownloading = episode.Torrents.Max(t => (uint)Math.Floor((DateTime.Now - t.Added).TotalHours));
                stalled = (percentComplete < 25 && hoursDownloading >= 1)
                    || (percentComplete < 50 && hoursDownloading >= 2)
                    || (percentComplete < 100 && hoursDownloading >= 4);

                if (!stalled)
                {
                    return new(show, episode, [], stripSpecialChars, 0);
                }
            }

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
                            search = showName + " " + (episode.Number == 0 ? episodeName : episode.SeriesEpisodeNumberWithOffset(show.DownloadSeriesOffset));
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
                    List<PirateBayTorrent>? torrents = (await httpClient.GetFromJsonAsync<List<PirateBayTorrent>>($"{pirateBay.Url}{HttpUtility.UrlEncode(search)}"))?.ToList();
                    if (torrents == null)
                    {
                        return null;
                    }

                    torrents = [..torrents.Where(t => t.Hash != "0000000000000000000000000000000000000000")];
                    int baseTorrentCount = torrents.Count;

                    torrents = [..torrents.Where(t => !episode.Torrents.Select(e => e.Hash).Contains(t.Hash))];
                    // db.Log(SessionId, $"Searched Pirate Bay for \"{search}\" - found {baseTorrentCount} results ({torrents.Count} after removing existing)");

                    if (torrents.Count > 0)
                    {
                        if (stalled)
                        {
                            if (torrents.Count > 10) { torrents = torrents[..10]; }
                        }
                        else
                        {
                            torrents = torrents[..1];
                        }
                    }


                    episode.Torrents.AddRange(torrents.Select(t => t.DbTorrent(episode)));
                    return new ClientTorrent(show, episode, torrents, stripSpecialChars, baseTorrentCount);
                }
                return null;
            }
            catch
            {
                return new ClientTorrent(show, episode, null, stripSpecialChars, 0);
            }            
        }


        public List<ClientFile> FilesToReTag(ClientData clientData)
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
            return returnFiles;
        }

        public List<ClientFile> FilesToDelete(ref ClientData clientData)
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
            return returnFiles;
        }

        public List<EpisodeModel> FilesToDownloadFromCloud(List<ShowModel> shows, ClientData clientData)
        {
            List<EpisodeModel> episodes = new();

            //Manually requested
            foreach (ClientFile file in clientData.Files.Where(f => f.Episode?.RequestDownload == true))
            {
                if (file.Episode?.FilePath != null)
                {
                    episodes.Add(file.Episode);
                    db.Log(SessionId, $"Request Download from Cloud (manually): {file.Episode.FilePath}");
                }
            }

            ConfigService configSrv = new(db);
            foreach (ShowModel show in shows)
            {
                if (show.KeepAllDownloaded) 
                {
                    //Keep all offline
                    foreach (EpisodeModel episode in show.Episodes.Where(e => e.InCloud == true && e.FilePath != null))
                    {
                        episodes.Add(episode);
                        db.Log(SessionId, $"Request Download from Cloud (keep all offline): {episode.FilePath}");
                    }
                }
                else if (configSrv.Config.UserConfig.SectionConfig(show.SiteSection).KeepNextEpisodeOffCloud)
                {
                    //Offline next episode
                    EpisodeModel? nextEpisodeWithFile = show.Unwatched.FirstOrDefault(e => e.FilePath != null);
                    if (nextEpisodeWithFile?.InCloud == true && nextEpisodeWithFile.FilePath != null)
                    {
                        episodes.Add(nextEpisodeWithFile);
                        db.Log(SessionId, $"Request Download from Cloud (next episode): {nextEpisodeWithFile.FilePath}");
                    }
                }
            }

            return episodes;
        }


        public void UpdateFilePaths(List<ClientFile> files, List<EpisodeModel> dbEpisodes)
        {
            //Remove file paths not on the client
            foreach (string? path in dbEpisodes.Where(e => e.FilePath?.StartsWith("http") == false).Select(e => e.FilePath).Except(files.Select(f => f.Path)))
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
                        if (dbEpisode.FilePath != file.Episode.FilePath || dbEpisode.InCloud != file.Episode.InCloud || dbEpisode.DurationSeconds != file.Episode.DurationSeconds)
                        {
                            Episode thisDbEpisode = db.Episodes.Single(e => e.EpisodeId == dbEpisode.Id && e.SiteSection == file.FileType);
                            thisDbEpisode.FilePath = file.Episode.FilePath;
                            thisDbEpisode.InCloud = file.InCloud;
                            thisDbEpisode.DurationSeconds = file.DurationSeconds;

                            dbEpisode.FilePath = file.Episode.FilePath;
                            dbEpisode.InCloud = file.Episode.InCloud;
                            dbEpisode.DurationSeconds = file.Episode.DurationSeconds;
                        }

                        //Remove completed download requests
                        if (dbEpisode.InCloud == false && dbEpisode.RequestDownload)
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
            List<string> clientHashes = clientTorrents.SelectMany(ct => ct.Torrents?.Select(t => t.Hash.ToUpper()) ?? []).ToList();
            
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

            //Update percentage
            foreach (ClientTorrent clientTorrent in clientTorrents)
            {
                foreach (PirateBayTorrent torrent in clientTorrent.Torrents ?? [])
                {
                    Torrent? dbTorrent = db.Torrents.FirstOrDefault(t => t.Hash == torrent.Hash);
                    if (dbTorrent != null)
                    {
                        dbTorrent.LastPercentage = (uint)Math.Floor(torrent.PercentComplete);
                    }
                }
            }

            db.SaveChanges();
        }
    }
}
