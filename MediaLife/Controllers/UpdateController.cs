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

using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using System.Linq;
using MediaLife.Services;
using MediaLife.Models;
using System;
using WCKDRZR.Gaspar;
using System.Text.Json;

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
            _ = showSrv.UpdateLastUpdatedAsync(clientSrv.SessionId).Result;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]/client")]
        public ActionResult<ClientActions> RunUpdate([FromBody] ClientData clientData)
        {
            try
            {
                ClientActions clientActions = new();

                if (configSrv.Config.UserConfig.ClientUpdateEnabled)
                {
                    showSrv.HousekeepLogs(configSrv.Config.LogDays);

                    clientSrv.LogReceivedPayload(JsonSerializer.Serialize(clientData));
                    clientSrv.LogClientData(clientData, "Received");
                    
                    _ = showSrv.UpdateLastUpdatedAsync(clientSrv.SessionId).Result;

                    List<ShowModel> dbData = showSrv.AnonShows();
                    List<EpisodeModel> dbEpisodes = dbData.SelectMany(s => s.Episodes).ToList();

                    clientData.MatchEpisodes(dbData);

                    int dbFileCount = dbEpisodes.Count(e => e.FilePath != null);
                    int clientFilePercentage = (int)(clientData.Files.Count / (double)dbFileCount * 100);
                    int? fileThreshold = configSrv.Config.UserConfig.ClientFileThresholdPercent;

                    if (fileThreshold == null || fileThreshold < clientFilePercentage)
                    {
                        clientSrv.UpdateFilePaths(clientData.Files, dbEpisodes);
                        clientSrv.UpdateTorrentReferences(clientData.Torrents);

                        clientActions.DeleteTorrents.AddRange(clientSrv.TorrentsToDelete(ref clientData));
                        clientActions.SaveAndDeleteTorrents.AddRange(clientSrv.TorrentsToSave(ref clientData));
                        clientActions.AddTorrents.AddRange(clientSrv.TorrentsToAdd(dbData, ref clientData));
                        clientActions.Downloads.AddRange(clientSrv.FilesToDownload(dbData));
                        clientActions.DeleteFiles.AddRange(clientSrv.FilesToDelete(ref clientData));
                        clientActions.ReTagFiles.AddRange(clientSrv.FilesToReTag(clientData));
                        clientActions.DownloadFileFromCloud.AddRange(clientSrv.FilesToDownloadFromCloud(dbData, clientData));

                        clientSrv.LogClientData(clientData, "Processed");
                        
                        clientSrv.LogReplyPayload(JsonSerializer.Serialize(clientActions));

                        clientSrv.LogDone();

                        return clientActions;
                    }
                    else
                    {
                        clientSrv.LogError(new Exception($"Update Stopped: Client File Threshold Breached. {clientData.Files.Count} files sent, {dbFileCount} files in database ({clientFilePercentage}%)"));
                        clientActions.Error = "Error: File Threshold Breached";
                        return clientActions;
                    }
                }

                clientSrv.LogDisabled();
                clientActions.Error = "Update is Disabled";
                return clientActions;
            }
            catch (Exception e)
            {
                clientSrv.LogError(e);
                throw;
            }
        }
    }
}