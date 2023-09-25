﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MediaLife.Library.Models;
using MediaLife.Models;
using MediaLife.Services;
using TvMaze.Api.Client;
using TvMaze.Api.Client.Models;

namespace MediaLife.DataProviders
{
    public class TVMaze
    {
        private TvMazeClient client;
        private Library.DAL.MySqlContext db;
        private List<Library.DAL.TVNetwork>? tvNetworks;

        public TVMaze(Library.DAL.MySqlContext dbContext)
        {
            client = new TvMazeClient();
            db = dbContext;
            tvNetworks = null;
        }

        public async Task<List<ShowModel>> SearchAsync(ShowsService showsService, string query)
        {
            List<ShowModel> shows = new();
            List<Task<ShowModel?>> showTasks = new();

            LoadTVNetworks();

            foreach (ShowSearchResult result in await client.Search.ShowSearchAsync(query))
            {
                ShowModel? showInDb = showsService.GetShow(SiteSection.TV, (uint)result.Show.Id);
                if (showInDb != null)
                {
                    showInDb.SearchScore = result.Score;
                    shows.Add(showInDb);
                }
                else
                {
                    showTasks.Add(GetShowAsync(result.Show, result.Score, false));
                }
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

        public async Task<ShowModel?> GetShowAsync(uint showId)
        {
            Show show = await client.Shows.GetShowMainInformationAsync((int)showId);
            return await GetShowAsync(show);
        }

        public async Task<int?> GetShowIdFromEpisode(int episodeId)
        {
            Episode episode = await client.Episodes.GetEpisodeMainInformationAsync(episodeId, EpisodeEmbeddingFlags.Show);
            if (episode != null)
            {
                return episode.Embedded.Show.Id;
            }
            return null;
        }

        private async Task<ShowModel?> GetShowAsync(Show show, double? searchScore = null, bool addNewTvNetworks = true)
        {
            IEnumerable<Episode> episodes = await client.Shows.GetShowEpisodeListAsync(show.Id, true);

            if (show != null)
            {
                ShowModel model = (
                    new ShowModel
                    {
                        Id = (uint)show.Id,
                        Name = show.Name,
                        Poster = show.Image?.Medium,
                        Network = GetTVNetwork(show.Network, addNewTvNetworks),
                        Added = null,
                        SiteSection = SiteSection.TV,
                        Episodes = (
                            from e in episodes
                            select new EpisodeModel
                            {
                                Id = (uint)e.Id,
                                SiteSection = SiteSection.TV,
                                SeriesNumber = (short)e.Season,
                                Number = (short)(e.Number ?? 0),

                                Name = e.Name,
                                AirDate = e.AirStamp?.UtcDateTime,
                                Watched = null
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

            return null;
        }

        private void LoadTVNetworks()
        {
            if (tvNetworks == null)
            {
                tvNetworks = db.TVNetworks.ToList();
            }
        }

        private Library.DAL.TVNetwork? GetTVNetwork(Network network, bool addToDb = true)
        {
            if (network == null || network.Country == null)
            {
                return null;
            }

            LoadTVNetworks();
            Library.DAL.TVNetwork? tvNetwork = tvNetworks?.FirstOrDefault(n => n.Name == network.Name && n.CountryCode == network.Country.Code);
            if (tvNetwork == null)
            {
                tvNetwork = new()
                {
                    Name = network.Name,
                    CountryCode = network.Country.Code,
                    HomepageUrl = network.OfficialSite
                };
                if (addToDb) {
                    db.TVNetworks.Add(tvNetwork);
                    db.SaveChanges();
                }
            }
            if (addToDb && tvNetwork.HomepageUrl != network.OfficialSite)
            {
                tvNetwork.HomepageUrl = network.OfficialSite;
                db.SaveChanges();
            }
            return tvNetwork;
        }
    }
}