using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
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
        private readonly Library.DAL.MySqlContext db;

        public YouTube(Library.DAL.MySqlContext dbContext, bool useProxy = false)
        {
            db = dbContext;
            client = new YoutubeClient();
            
            if (useProxy)
            {
                ConfigService configService = new(db);
                string? proxyAddress = configService.Config.UserConfig.YouTubeConfig.EpisodeProxy;
                if (!string.IsNullOrEmpty(proxyAddress))
                {
                    client = new(
                        new HttpClient(
                            new HttpClientHandler() { Proxy = new WebProxy(proxyAddress) }
                        )
                    );
                }
            }
        }

        public async Task<List<ShowModel>> SearchAsync(ShowsService showsService, string query)
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
                    showTasks.Add(GetShowAsync(channel, score));
                }
                score--;
            }

            while (showTasks.Any())
            {
                Task<ShowModel?> finishedTask = Task.WhenAny(showTasks).Result;
                showTasks.Remove(finishedTask);
                try
                {
                    if (finishedTask.Result != null)
                    {
                        shows.Add(finishedTask.Result);
                    }
                }
                catch {} //bad result; discard
            }

            return shows;
        }

        public async Task<ShowModel?> GetShowAsync(string showId)
        {
            if (showId.StartsWith("PL"))
            {
                Playlist show = await client.Playlists.GetAsync(showId);
                return await GetShowAsync(show);
            }
            else
            {
                Channel show = await client.Channels.GetAsync(showId);
                return await GetShowAsync(show);
            }
        }

        private async Task<ShowModel?> GetShowAsync(Playlist playlist, double? searchScore = null, CancellationToken cancellationToken = default)
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
                    Episodes = GetEpisodes(playlistVideos),
                }
            );
            if (searchScore != null)
            {
                model.SearchScore = (double)searchScore;
            }

            return model;
        }

        private async Task<ShowModel?> GetShowAsync(Channel channel, double? searchScore = null, CancellationToken cancellationToken = default)
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
                    Episodes = GetEpisodes(playlistVideos),
                }
            );
            if (searchScore != null)
            {
                model.SearchScore = (double)searchScore;
            }
            
            return model;
        }

        private List<EpisodeModel> GetEpisodes(List<PlaylistVideo> playlistVideos)
        {
            List<EpisodeModel> episodes = playlistVideos.Select(v => new EpisodeModel()
            {
                Id = v.Id,
                SiteSection = SiteSection.YouTube,
                SeriesNumber = 1,
                Number = 0,
                Name = v.Title,
                Poster = StripQuery(v.Thumbnails.FirstOrDefault()?.Url),
            }).OrderBy(s => s.AirDate).ToList();

            return episodes;
        }

        public async Task<DateTime> GetPublishDateForEpisode(string episodeId)
        {
            Video video = await client.Videos.GetAsync(episodeId);
            return video.UploadDate.DateTime;
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