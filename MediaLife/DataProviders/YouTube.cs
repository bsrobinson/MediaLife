using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using MediaLife.Extensions;
using MediaLife.Library.Models;
using MediaLife.Models;
using MediaLife.Services;
using YoutubeExplode;
using YoutubeExplode.Channels;
using YoutubeExplode.Common;
using YoutubeExplode.Playlists;
using YoutubeExplode.Search;
using YoutubeExplode.Videos;

namespace MediaLife.DataProviders
{
    public class YouTube
    {
        private readonly YoutubeClient client;
        private readonly ConfigService configSrv;
        private readonly Library.DAL.MySqlContext db;

        public YouTube(Library.DAL.MySqlContext dbContext, Guid? updateSessionId = null)
        {
            db = dbContext;
            configSrv = new(db);

            if (configSrv.Config.UserConfig.YouTubeConfig.UseProxy)
            {
                WebProxy? workingProxy = null;
                if (configSrv.Config.UserConfig.YouTubeConfig.LastWorkingProxyAddress != null)
                {
                    workingProxy = TestProxy(configSrv.Config.UserConfig.YouTubeConfig.LastWorkingProxyAddress, wasGood: true);
                    if (updateSessionId != null && workingProxy != null) { db.Log((Guid)updateSessionId, $"YouTube update using proxy {workingProxy.Address} (again)"); }

                    if (workingProxy == null) { ClearLastUsedProxy(); }
                }

                if (workingProxy == null)
                {
                    ProxyScrapeModel? json = new HttpClient().GetFromJsonAsync<ProxyScrapeModel>("https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=json").Result;
                    if (json != null)
                    {
                        Stack<ProxyModel> proxies = new(json.Proxies.Where(p => p.Alive).OrderBy(p => p.LastSeen));
                    
                        Stopwatch sw = new();
                        sw.Start();

                        while (workingProxy == null && sw.ElapsedMilliseconds < 60000)
                        {
                            if (proxies.TryPeek(out var proxy))
                            {
                                workingProxy = TestProxy(proxy.Proxy);
                            }
                        }

                        if (updateSessionId != null && workingProxy != null) { db.Log((Guid)updateSessionId, $"YouTube update using proxy {workingProxy.Address}"); }
                    }
                }

                if (workingProxy == null)
                {
                    throw new Exception("Cannot find working proxy");
                }

                SetLastUsedProxy(workingProxy);

                HttpClient httpClient = new(new HttpClientHandler() { Proxy = workingProxy });
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                client = new YoutubeClient(httpClient);
            }
            else
            {
                client = new YoutubeClient();
            }
        }

        private WebProxy? TestProxy(string? address, bool wasGood = false)
        {
            if (address == null) { return null; }

            try
            {
                WebProxy proxy = new(address);
                HttpClient testClient = new(new HttpClientHandler() { Proxy = proxy });
                testClient.Timeout = TimeSpan.FromSeconds(wasGood ? 15 : 5);
                
                _ = new ChannelClient(testClient).GetAsync("UCK8sQmJBp8GCxrOtXWBpyEA").Result;

                return proxy;
            }
            catch
            {
                return null;
            }
        }

        private void SetLastUsedProxy(WebProxy proxy)
        {
            if (proxy.Address?.ToString() != configSrv.Config.UserConfig.YouTubeConfig.LastWorkingProxyAddress)
            {
                configSrv.Config.UserConfig.YouTubeConfig.LastWorkingProxyAddress = proxy.Address?.ToString();
                configSrv.SaveToDatabase();
            }
        }

        private void ClearLastUsedProxy()
        {
            configSrv.Config.UserConfig.YouTubeConfig.LastWorkingProxyAddress = null;
            configSrv.SaveToDatabase();
        }


        public async Task<List<ShowModel>> SearchAsync(ShowsService showsService, string query)
        {
            try
            {
                List<ShowModel> shows = new();
                List<Task<ShowModel?>> showTasks = new();
                
                int score = 999;
                foreach (ChannelSearchResult result in await client.Search.GetChannelsAsync(query).CollectAsync(10))
                {
                    ShowModel? showInDb = showsService.GetShow(SiteSection.YouTube, result.Id);
                    if (showInDb != null)
                    {
                        shows.Add(showInDb);
                    }
                    else
                    {
                        Channel channel = new(result.Id, result.Title, result.Thumbnails);
                        showTasks.Add(GetShowAsync(channel, score, false));
                    }
                    score--;
                }

                while (showTasks.Any())
                {
                    Task<ShowModel?> finishedTask = Task.WhenAny(showTasks).Result;
                    showTasks.Remove(finishedTask);
                    if (finishedTask.Result != null)
                    {
                        shows.Add(finishedTask.Result);
                    }
                }

                return shows;
            }
            catch
            {
                ClearLastUsedProxy();
                throw;
            }
        }

        public async Task<ShowModel?> GetShowAsync(string showId)
        {
            try
            {    
                CancellationTokenSource cancellationTokenSource = new();
                cancellationTokenSource.CancelAfter(60000);

                if (showId.StartsWith("PL"))
                {
                    Playlist show = await client.Playlists.GetAsync(showId);
                    return await GetShowAsync(show, cancellationToken: cancellationTokenSource.Token);
                }
                else
                {
                    Channel show = await client.Channels.GetAsync(showId);
                    return await GetShowAsync(show, cancellationToken: cancellationTokenSource.Token);
                }
            }
            catch
            {
                ClearLastUsedProxy();
                throw;
            }
        }

        private async Task<ShowModel?> GetShowAsync(Playlist playlist, double? searchScore = null, bool getPublishDate = true, CancellationToken cancellationToken = default)
        {
            List<PlaylistVideo> playlistVideos = (await client.Playlists.GetVideosAsync(playlist.Id, cancellationToken)).ToList();

            ShowModel model = (
                new ShowModel
                {
                    Id = playlist.Id,
                    Name = playlist.Title,
                    Poster = playlist.Thumbnails.FirstOrDefault()?.Url,
                    IsAdded = false,
                    SiteSection = SiteSection.YouTube,
                    Episodes = await GetEpisodes(playlistVideos, getPublishDate),
                }
            );
            if (searchScore != null)
            {
                model.SearchScore = (double)searchScore;
            }
            return model;
        }

        private async Task<ShowModel?> GetShowAsync(Channel channel, double? searchScore = null, bool getPublishDate = true, CancellationToken cancellationToken = default)
        {
            List<PlaylistVideo> playlistVideos = (await client.Channels.GetUploadsAsync(channel.Id, cancellationToken)).ToList();
            
            ShowModel model = (
                new ShowModel
                {
                    Id = channel.Id,
                    Name = channel.Title,
                    Poster = channel.Thumbnails.FirstOrDefault()?.Url,
                    IsAdded = false,
                    SiteSection = SiteSection.YouTube,
                    Episodes = await GetEpisodes(playlistVideos, getPublishDate),
                }
            );
            if (searchScore != null)
            {
                model.SearchScore = (double)searchScore;
            }
            return model;
        }

        private async Task<List<EpisodeModel>> GetEpisodes(List<PlaylistVideo> playlistVideos, bool getPublishDate = true)
        {
            List<EpisodeModel> episodes = playlistVideos.Select(v => new EpisodeModel()
            {
                Id = v.Id,
                SiteSection = SiteSection.YouTube,
                SeriesNumber = 1,
                Number = 0,
                Name = v.Title,
                Poster = StripQuery(v.Thumbnails.FirstOrDefault()?.Url),
                AirDate = DateTime.Now, //ensure counted
            }).OrderBy(s => s.AirDate).ToList();

            if (getPublishDate)
            {
                await Parallel.ForEachAsync(episodes, async (episode, cancellationToken) => {
                    Video video = await client.Videos.GetAsync(episode.Id);
                    episode.AirDate = video.UploadDate.DateTime;
                });
            }

            return episodes;
        }

        private string? StripQuery(string? url)
        {
            if (url != null)
            {
                int queryPos = url.IndexOf('?');
                if (queryPos > 0)
                {
                    url = url[..queryPos];
                }
            }

            return url;
        }
    }
}