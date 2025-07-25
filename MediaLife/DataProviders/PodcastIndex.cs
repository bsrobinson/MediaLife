using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MediaLife.Library.Models;
using MediaLife.Models;
using MediaLife.Services;
using PodcastIndexSharp;
using PodcastIndexSharp.Clients;
using PodcastIndexSharp.Model;
// using PodcastAPI;


namespace MediaLife.DataProviders
{
    public class PodcastIndex
    {
        private Library.DAL.MySqlContext db;
        private PodcastIndexConfig config;

        public PodcastIndex(Library.DAL.MySqlContext dbContext)
        {
            db = dbContext;

            PodcastConfig podcastConfig = new ConfigService(dbContext).Config.UserConfig.PodcastConfig;
            config = new()
            {
                AuthKey = podcastConfig.PodcastIndexApiKey ?? "",
                Secret = podcastConfig.PodcastIndexApiSecret ?? "",
            };
        }

        public async Task<List<ShowModel>> SearchAsync(ShowsService showsService, string query)
        {
            SearchClient client = new(config);

            List<ShowModel> shows = [];
            List<Task<ShowModel?>> showTasks = new();

            int score = 999;
            foreach (Podcast result in await client.Podcasts(query))
            {   
                ShowModel? showInDb = null;//showsService.GetShow(SiteSection.Podcast, result.Id.ToString());
                if (showInDb != null)
                {
                    showInDb.SearchScore = score;
                    shows.Add(showInDb);
                }
                else
                {
                    showTasks.Add(GetShowAsync(result, score, loadEpisodes: false));
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

        public async Task<ShowModel?> GetPodcastAsync(int showId)
        {
            Podcast podcast = await new PodcastsClient(config).ByFeedId((uint)showId);
            return await GetShowAsync(podcast);
        }

        private async Task<ShowModel?> GetShowAsync(Podcast podcast, double? searchScore = null, bool loadEpisodes = true)
        {
            EpisodesClient client = new(config);

            IEnumerable<Episode> episodes = loadEpisodes
                ? await client.ByFeedId((uint)podcast.Id, max: 1000)
                : Enumerable.Repeat(new Episode(), podcast.EpisodeCount ?? 0);
            
            ShowModel model = (
                new ShowModel
                {
                    Id = podcast.Id.ToString(),
                    Name = podcast.Title,
                    Poster = podcast.Image?.ToString(),
                    IsAdded = false,
                    SiteSection = SiteSection.Podcast,
                    Episodes = (
                        from e in episodes
                        select new EpisodeModel
                        {
                            Id = e.Id.ToString(),
                            SiteSection = SiteSection.Podcast,
                            SeriesNumber = (short)(e.Season ?? 0),
                            Number = (short)(e.EpisodeNumber ?? 0),
                            Name = e.Title,
                            Poster = e.Image?.ToString(),
                            AirDate = e.DatePublished,
                            FilePath = e.EnclosureUrl?.ToString(),
                        }
                    ).OrderBy(s => s.AirDate).ToList()
                }
            );
            if (searchScore != null)
            {
                model.SearchScore = (double)searchScore;
            }
            return model;
        }
    }
}