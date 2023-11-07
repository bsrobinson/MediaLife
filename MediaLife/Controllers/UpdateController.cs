using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using System.Linq;
using MediaLife.Services;
using MediaLife.Models;
using System.IO;
using System;
using MediaLife.Library.Models;

namespace MediaLife.Controllers
{
    public class UpdateController : Controller
    {
        private ShowsService showSrv;
        private ClientService clientSrv;
        private ConfigService configSrv;

        public UpdateController(MySqlContext context)
        {
            Guid sessionId = Guid.NewGuid();
            showSrv = new(context, sessionId);
            clientSrv = new(context, sessionId);
            configSrv = new(context);
        }

        [HttpGet("[controller]")]
        public void UpdateLastUpdated()
        {
            showSrv.HousekeepLogs(configSrv.Config.LogDays);
            _ = showSrv.UpdateLastUpdatedAsync().Result;
        }

        [HttpPost("[controller]/client")]
        public IActionResult UpdateFromClient()
        {
            //!!
            //TODO - Next
            //  Embed related (or any) shows
            //      Taskmaster should embed Champion of Champions (as series), and the podcast (inline)
            //      Apprentise should embed You're Fired (inline)
            //          Sequel shows could also be embeded as series
            //          Inline is [Matching Date | Matching Title (maybe regex)
            //      Embeded shows don't show in list view
            //      Shows not embeded, but related should show as new episodes until embeded or ignored
            //  Config page
            //      
            //TODO - Bugs
            //  Setting panel not showing defaults on add new show (noticeable with download limit)
            //  If file is added manually for an existing torrent:
            //      on first run, torrent is deleted, file is tagged, but path isn't saved - SAVE PATH
            //      on next run (because the file isn't logged); torrent will be re-added :/
            //  If a folder is saved; try to handle
            //      
            //TODO - Future
            //  Allow manual/multiple torrent management
            //      Add and delete multiple hashes to an episode
            //      If any hash completes, all are removed (should just work as-is)
            //      If torrent added too long ago, automatically add as many as we can
            //  Books file list should be received and understood
            //      Enable book torrenting
            //  Flag Orange Files and allow confirm (remove orange and fully reset name)
            //  List un-mapped files and delete or map

            try
            {
                if (configSrv.Config.UserConfig.ClientUpdateEnabled)
                {
                    showSrv.HousekeepLogs(configSrv.Config.LogDays);

                    StreamReader body = new(Request.Body);
                    string data = body.ReadToEndAsync().Result;

                    clientSrv.LogReceivedPayload(data);

                    ClientData clientData = new(data);
                    if (!clientData.Valid)
                    {
                        string error = "Received data payload is invalid.  Couldn't find FILES and TORRENTS";
                        clientSrv.LogError(error);
                        return Content(AddGroup("ERROR", error));
                    }
                    clientSrv.LogClientData(clientData, "Received");

                    _ = showSrv.UpdateLastUpdatedAsync().Result;

                    List<ShowModel> dbData = showSrv.Shows();
                    List<EpisodeModel> dbEpisodes = dbData.SelectMany(s => s.Episodes).ToList();

                    clientData.MatchEpisodes(dbData);

                    int dbFileCount = dbEpisodes.Count(e => e.FilePath != null);
                    int clientFilePercentage = (int)((clientData.Files.Count / (double)dbFileCount) * 100);
                    int? fileThreshold = configSrv.Config.UserConfig.ClientFileThresholdPercent;

                    if (fileThreshold == null || fileThreshold < clientFilePercentage)
                    {
                        string returnData = "";
                        returnData += AddGroup("DELETE_TORRENTS", clientSrv.TorrentsToDelete(ref clientData));
                        returnData += AddGroup("SAVE_&_DELETE_TORRENTS:TV", clientSrv.TorrentsToSave(SiteSection.TV, ref clientData));
                        returnData += AddGroup("SAVE_&_DELETE_TORRENTS:MOVIES", clientSrv.TorrentsToSave(SiteSection.Movies, ref clientData));
                        returnData += AddGroup("ADD_TORRENTS", clientSrv.TorrentsToAdd(dbData, ref clientData));
                        returnData += AddGroup("DELETE_FILES", clientSrv.FilesToDelete(ref clientData));
                        returnData += AddGroup("RETAG_FILES", clientSrv.FilesToReTag(clientData));
                        returnData += AddGroup("DOWNLOAD_FILES_FROM_CLOUD", clientSrv.FilesToDownloadFromCloud(dbData, clientData));

                        clientSrv.LogClientData(clientData, "Processed");

                        clientSrv.UpdateFilePaths(clientData.Files, dbEpisodes);
                        clientSrv.UpdateTorrentReferences(clientData.Torrents);

                        clientSrv.LogReplyPayload(returnData);

                        return Content(returnData);
                    }
                    else
                    {
                        clientSrv.LogError($"Update Stopped: Client File Threshold Breached. {clientData.Files.Count} files sent, {dbFileCount} files in database ({clientFilePercentage}%)");
                        return Content("Error: File Threshold Breached");
                    }
                }

                clientSrv.LogDisabled();
                return Content("Update is Disabled");
            }
            catch (Exception e)
            {
                clientSrv.LogError(e.Message);
                throw;
            }
        }

        private string AddGroup(string groupName, string data)
        {
            return $"START_GROUP:{groupName}\n{data}\n";
        }
    }
}