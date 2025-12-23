using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using MediaLife.Services;
using MediaLife.Models;
using MediaLife.Attributes;
using System;
using WCKDRZR.Gaspar;
using MediaLife.Library.Models;
using Newtonsoft.Json;

namespace MediaLife.Controllers
{
    [Authorised]
    public class HomeController : Controller
    {
        private ShowsService service;

        public HomeController(MySqlContext context)
        {
            service = new ShowsService(context, Guid.NewGuid());
        }

        public ViewResult Index()
        {
            ViewBag.TorrentSearchIssue = service.TorrentSearchIssue();
            ViewBag.ShowUpdateIssue = service.ShowUpdateIssue();

            ViewData["jsData"] = new ListPageModel(User.Obj(), PageType.Shows);
            return View(ViewData["jsData"]);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("/watching")]
        public ActionResult<List<ShowModel>> Watching()
        {
            return service.CurrentlyWatching(User.Obj());
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("/notstarted")]
        public ActionResult<List<ShowModel>> NotStarted()
        {
            return service.NotStarted(User.Obj());
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("/all")]
        public ActionResult<List<ShowModel>> AllShows()
        {
            return service.UsersShowsAndLists(User.Obj());
        }

        [HttpGet("/search")]
        public ViewResult Search(string q)
        {
            ViewBag.q = q;
            ViewData["jsData"] = new ListPageModel(User.Obj(), PageType.Search);
            return View(nameof(Index), ViewData["jsData"]);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("{section}/search")]
        public ActionResult<List<ShowModel>> SearchResults(SiteSection section, string q)
        {
            return service.Search(section, q);
        }

        [HttpGet("{section}/{showId}")]
        public IActionResult Show(SiteSection section, string showId)
        {
            ShowModel? show = service.GetShow(section, showId, User.Obj());
            if (show == null)
            {
                show = service.GetShowFromProviderAsync(section, showId).Result;
                if (show == null)
                {
                    return NotFound();
                }
            }
            ViewData["jsData"] = new ShowPageModel(User.Obj(), section, show, service.Recommenders(User.Obj()), service.SomeEpisodesInList(show));
            return View(ViewData["jsData"]);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("{section}/add/{showId}")]
        public ActionResult<ShowModel> AddShow(SiteSection section, string showId)
        {
            ShowModel? show = service.AddShow(section, showId, User.Obj());
            if (show != null)
            {
                return show;
            }
            return Problem();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpDelete("{section}/remove/{showId}")]
        public ActionResult<bool> RemoveShow(SiteSection section, string showId)
        {
            if (service.RemoveShow(section, showId, User.Obj()))
            {
                return true;
            }
            return Problem();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("{section}/update/{showId}")]
        public ActionResult<ShowModel?> UpdateShow(SiteSection section, string showId)
        {
            string? updateError = service.UpdateShowAsync(section, showId).Result;
            if (updateError == null)
            {
                ShowModel? show = service.GetShow(section, showId, User.Obj());
                return show;
            }
            return Problem(updateError);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[action]/{episodeId}")]
        public ActionResult<DateTime?> SetYouTubePublishedDate(string episodeId)
        {
            DateTime? airDate = service.SetYouTubePublishedDate(episodeId).Result;
            if (airDate != null)
            {
                return airDate;
            }
            return Problem();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("{section}/poster/{showId}")]
        public ActionResult<ShowModel> SetShowPoster(SiteSection section, string showId, [FromBody] string posterUrl)
        {
            ShowModel? show = service.SetShowPoster(section, showId, posterUrl);
            if (show != null)
            {
                return show;
            }

            return Problem();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("{section}/[action]/{episodeId:int}")]
        public ActionResult<EpisodeModel> Episode(SiteSection section, string episodeId)
        {
            EpisodeModel? episode = service.GetEpisode(section, episodeId, User.Obj());
            if (episode != null)
            {
                return episode;
            }
            return NotFound();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPut("{section}/[action]/{showId}")]
        public ActionResult<UserShow> RemoveFilters(SiteSection section, string showId)
        {
            UserShow? show = service.RemoveFilters(section, showId, User.Obj());
            if (show != null)
            {
                return show;
            }
            return NotFound();

        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPut("{section}/[action]/{showId}")]
        public IActionResult SaveSettings(SiteSection section, string showId, [FromBody] ShowSettings model)
        {
            service.UpdateSettings(section, showId, model, User.Obj());
            return Ok();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPut("{section}/[action]/{updateAllUsers}/{showId}")]
        public ActionResult<ShowModel> UpdateEpisode(SiteSection section, bool updateAllUsers, string showId, [FromBody] EpisodeModel episode)
        {
            ShowModel? show = service.UpdateEpisode(section, showId, User.Obj(), episode, updateAllUsers);
            if (show != null)
            {
                return show;
            }
            return NotFound();
        }


        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[action]/{hash}")]
        public ActionResult<EpisodeModel> AddTorrentHash([FromBody] EpisodeModel episode, string hash)
        {
            EpisodeModel? editedEpisode = service.AddTorrentHash(episode, hash, User.Obj());
            if (editedEpisode == null)
            {
                return BadRequest("Hash already exists");
            }

            return editedEpisode;
        }


        [ExportFor(GasparType.TypeScript)]
        [HttpPut("[action]/{name}")]
        public ActionResult<ShowModel?> CreateList(string name, [FromBody] List<EpisodeId> episodes)
        {
            return service.CreateList(name, User.Obj(), episodes);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPut("[action]/{listId}")]
        public ActionResult<ShowModel> AddToList(uint listId, [FromBody] List<EpisodeId> episodes)
        {
            ShowModel? model = service.AddToList(listId, User.Obj(), episodes);
            if (model != null)
            {
                return model;
            }
            return NotFound();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPut("[action]/{id}/{name}")]
        public ActionResult<ShowModel?> UpdateList(uint id, string name, [FromBody] List<EpisodeId> episodes)
        {
            return service.UpdateList(id, name, episodes);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpDelete("[action]/{id}")]
        public ActionResult<bool> DeleteList(uint id)
        {
            return service.DeleteList(id) ? true : Problem();
        }
    }
}