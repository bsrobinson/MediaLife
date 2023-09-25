using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading.Tasks;
using GoodreadsScrapper;
using GoodreadsScrapper.Models;
using MediaLife.Library.DAL;
using MediaLife.Library.Models;
using MediaLife.Models;
using MediaLife.Services;

namespace MediaLife.DataProviders
{
    public class Goodreads
    {
        private MySqlContext db;
        private GoodreadsClient client;

        public Goodreads(MySqlContext context)
        {
            db = context;
            client = new GoodreadsClient();
        }

        public async Task<List<ShowModel>> SearchAsync(ShowsService showsService, string query)
        {
            List<Task<Book?>> bookDetailTasks = new();

            List<ShowModel> books = new();
            List<int> orderedIds = new();
            List<int> validIds = new();

            foreach (SearchBook book in (await client.SearchBooksAsync(query)))
            {
                if (book.Url != null)
                {
                    orderedIds.Add(book.Id);
                    bookDetailTasks.Add(client.GetBookAsync(book.Url, true));
                }
            }
            while (bookDetailTasks.Any())
            {
                Task<Book?> finishedTask = Task.WhenAny(bookDetailTasks).Result;
                bookDetailTasks.Remove(finishedTask);

                if (finishedTask.Result != null)
                {
                    int id = finishedTask.Result.Series?.Id ?? finishedTask.Result.Id;
                    if (!validIds.Contains(id))
                    {
                        validIds.Add(id);
                        int score = 999 - orderedIds.IndexOf(finishedTask.Result.Id);

                        ShowModel? bookInDb = showsService.GetShow(SiteSection.Books, (uint)id);
                        if (bookInDb != null)
                        {
                            bookInDb.SearchScore = score;
                            books.Add(bookInDb);
                        }
                        else if (finishedTask.Result != null)
                        {
                            ShowModel? book = BookToShowModel(finishedTask.Result, score);
                            if (book != null)
                            {
                                books.Add(book);
                            }
                        }
                    }
                }
            }

            return books;
        }

        public async Task<ShowModel?> GetBookAsync(uint bookId)
        {
            return BookToShowModel(await client.GetBookAsync((int)bookId, true));
        }

        private ShowModel? BookToShowModel(Book? book, double? searchScore = null)
        {
            if (book == null)
            {
                return null;
            }

            ShowModel model;

            if (book.Series != null)
            {
                model = new()
                {
                    Id = (uint)book.Id,
                    Name = book.Series.Name ?? book.Series.Books.First().Name,
                    SiteSection = SiteSection.Books
                };

                foreach (BookInSeries entry in book.Series.Books)
                {
                    model.AddEpisode(new()
                    {
                        Id = (uint)entry.Id,
                        SiteSection = SiteSection.Books,
                        Name = entry.Name,
                        Number = (short)Math.Floor(entry.SeriesPosition),
                        SeriesNumber = 1,
                        AirDate = entry.PublishedYear != null ? new DateTime((int)entry.PublishedYear, 1, 1) : null,
                        Poster = entry.Image,
                        Author = entry.Author?.Name
                    });
                }
            }
            else
            {
                model = new()
                {
                    Id = (uint)book.Id,
                    Name = book.Name,
                    Poster = book.Image,
                    SiteSection = SiteSection.Books,
                    Episodes = new() { new EpisodeModel() {
                        Id = (uint)book.Id,
                        SiteSection = SiteSection.Books,
                        Name = book.Name,
                        SeriesNumber = 1,
                        Number = 1,
                        AirDate = book.PublishedYear != null ? new DateTime((int)book.PublishedYear, 1, 1) : null,
                        Poster = book.Image,
                        Author = book.Author?.Name
                    }}
                };
            }

            if (searchScore != null)
            {
                model.SearchScore = (double)searchScore;
            }
            return model;
        }
    }
}