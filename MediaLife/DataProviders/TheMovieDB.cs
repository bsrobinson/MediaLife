using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TMDbLib.Client;
using TMDbLib.Objects.Collections;
using TMDbLib.Objects.General;
using TMDbLib.Objects.Movies;
using TMDbLib.Objects.Search;
using MediaLife.Library.DAL;
using MediaLife.Models;
using MediaLife.Services;
using MediaLife.Library.Models;

namespace MediaLife.DataProviders
{
    public class TheMovieDB
    {
        private MySqlContext db;

        private TMDbClient client;
        private string? country;

        public TheMovieDB(MySqlContext context)
        {
            db = context;

            ConfigService config = new(db);
            client = new(config.GetString("themoviedbAPIKey"));
            country = config.GetString("MovieCountry");
        }

        public async Task<List<ShowModel>> SearchAsync(ShowsService showsService, string query)
        {
            List<Task<Movie>> movieDetailTasks = new();
            List<Task<ShowModel?>> movieShowTasks = new();

            List<ShowModel> movies = new();
            List<int> validIds = new();

            List<int> orderedCollectionIds = new();
            List<int> orderedMovieIds = new();

            //Search collections
            foreach (SearchCollection collection in (await client.SearchCollectionAsync(query)).Results)
            {
                validIds.Add(collection.Id);
                orderedCollectionIds.Add(collection.Id);
                movieShowTasks.Add(GetMovieFromCollectionAsync(collection.Id));
            }
            while (movieShowTasks.Any())
            {
                Task<ShowModel?> finishedTask = Task.WhenAny(movieShowTasks).Result;
                movieShowTasks.Remove(finishedTask);

                if (finishedTask.Result != null)
                {
                    int score = 9999 - orderedCollectionIds.IndexOf((int)finishedTask.Result.Id);
                    ShowModel? movieInDb = showsService.GetShow(SiteSection.Movies, finishedTask.Result.Id);
                    if (movieInDb != null)
                    {
                        movieInDb.SearchScore = score;
                        movies.Add(movieInDb);
                    }
                    else
                    {
                        finishedTask.Result.SearchScore = score;
                        movies.Add(finishedTask.Result);
                    }

                    validIds.Add((int)finishedTask.Result.Id);
                }
            }

            //Search movies
            foreach (SearchMovie movie in (await client.SearchMovieAsync(query)).Results)
            {
                orderedMovieIds.Add(movie.Id);
                movieDetailTasks.Add(client.GetMovieAsync(movie.Id));
            }
            while (movieDetailTasks.Any())
            {
                Task<Movie> finishedTask = Task.WhenAny(movieDetailTasks).Result;
                movieDetailTasks.Remove(finishedTask);

                int score = 999 - orderedMovieIds.IndexOf(finishedTask.Result.Id);
                int id = finishedTask.Result.BelongsToCollection?.Id ?? finishedTask.Result.Id;
                if (!validIds.Contains(id))
                {
                    validIds.Add(id);

                    ShowModel? movieInDb = showsService.GetShow(SiteSection.Movies, (uint)id);
                    if (movieInDb != null)
                    {
                        movieInDb.SearchScore = score;
                        movies.Add(movieInDb);
                    }
                    else
                    {
                        movieShowTasks.Add(GetMovieAsync(finishedTask.Result, score));
                    }
                }
            }
            while (movieShowTasks.Any())
            {
                Task<ShowModel?> finishedTask = Task.WhenAny(movieShowTasks).Result;
                movieShowTasks.Remove(finishedTask);
                if (finishedTask.Result != null)
                {
                    movies.Add(finishedTask.Result);
                }
            }

            return movies;
        }

        public async Task<ShowModel?> GetMovieAsync(uint movieId)
        {
            return await GetMovieAsync(await client.GetMovieAsync((int)movieId));
        }

        private async Task<ShowModel?> GetMovieAsync(Movie movie, double? searchScore = null)
        {
            if (movie == null)
            {
                return null;
            }

            ShowModel? model;

            if (movie.BelongsToCollection != null)
            {
                model = await GetMovieFromCollectionAsync(movie.BelongsToCollection.Id);
            }
            else
            {
                ReleaseDateItem? release = Release(movie.Id);
                model = new()
                {
                    Id = (uint)movie.Id,
                    Name = movie.Title,
                    Poster = FullPosterPath(movie.PosterPath),
                    SiteSection = SiteSection.Movies,
                    Episodes = new() { new EpisodeModel() {
                        Id = (uint)movie.Id,
                        SiteSection = SiteSection.Movies,
                        Name = movie.Title,
                        SeriesNumber = 1,
                        Number = 1,
                        AirDate = release?.ReleaseDate ?? movie.ReleaseDate,
                        Certificate = release?.Certification,
                        Poster = FullPosterPath(movie.PosterPath)
                    }}
                };
            }

            if (model != null && searchScore != null)
            {
                model.SearchScore = (double)searchScore;
            }
            return model;
        }

        private async Task<ShowModel?> GetMovieFromCollectionAsync(int collectionId)
        {
            Collection movieCollection = await client.GetCollectionAsync(collectionId);

            ShowModel model = new()
            {
                Name = movieCollection.Name ?? movieCollection.Parts[0].Title,
                Poster = FullPosterPath(movieCollection.PosterPath ?? movieCollection.Parts[0].PosterPath)
            };

            foreach (SearchMovie part in movieCollection.Parts)
            {
                ReleaseDateItem? release = Release(part.Id);
                model.Id = (uint)part.Id;
                model.SiteSection = SiteSection.Movies;
                model.AddEpisode(new()
                {
                    Id = (uint)part.Id,
                    SiteSection = SiteSection.Movies,
                    Name = part.Title,
                    SeriesNumber = 1,
                    AirDate = release?.ReleaseDate ?? part.ReleaseDate,
                    Certificate = release?.Certification,
                    Poster = FullPosterPath(part.PosterPath)
                });
            }
            model.NumberEpisodesByAirDate();

            return model;
        }

        private string? FullPosterPath(string fileRef)
        {
            return fileRef != null ? $"https://image.tmdb.org/t/p/w500{fileRef}" : null;
        }

        private ReleaseDateItem? Release(int movieId)
        {
            if (country != null)
            {
                List<ReleaseDatesContainer> releases = client.GetMovieReleaseDatesAsync(movieId).Result.Results;
                if (releases != null)
                {
                    List<ReleaseDateItem>? countryReleases = releases.FirstOrDefault(r => r.Iso_3166_1 == country)?.ReleaseDates;
                    if (countryReleases != null)
                    {
                        return countryReleases.FirstOrDefault(r => !string.IsNullOrEmpty(r.Certification));
                    }
                }
            }
            return null;
        }
    }
}

