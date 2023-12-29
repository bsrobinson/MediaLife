using System;
using System.Collections.Generic;
using System.Linq;
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
        private YoutubeClient client;
        private Library.DAL.MySqlContext db;

        public YouTube(Library.DAL.MySqlContext dbContext)
        {
            client = new YoutubeClient();
            db = dbContext;
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

        private async Task<ShowModel?> GetShowAsync(Playlist playlist, double? searchScore = null, bool getPublishDate = true)
        {
            List<PlaylistVideo> playlistVideos = new();
            try
            {
                playlistVideos = (await client.Playlists.GetVideosAsync(playlist.Id)).ToList();
            }
            catch { }
            
            ShowModel model = (
                new ShowModel
                {
                    Id = playlist.Id,
                    Name = playlist.Title,
                    Poster = playlist.Thumbnails.FirstOrDefault()?.Url,
                    Added = null,
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

        private async Task<ShowModel?> GetShowAsync(Channel channel, double? searchScore = null, bool getPublishDate = true)
        {
            List<PlaylistVideo> playlistVideos = new();
            try
            {
                playlistVideos = (await client.Channels.GetUploadsAsync(channel.Id)).ToList();
            }
            catch { }
            
            ShowModel model = (
                new ShowModel
                {
                    Id = channel.Id,
                    Name = channel.Title,
                    Poster = channel.Thumbnails.FirstOrDefault()?.Url,
                    Added = null,
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
    }
}