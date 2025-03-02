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

        public RedirectResult Index()
        {
            return Redirect("tv");
        }

        [HttpGet("{section}")]
        public ViewResult Index(SiteSection section)
        {
            ViewBag.PirateBayIssue = service.PirateBayIssue();
            ViewBag.ShowUpdateIssue = service.ShowUpdateIssue();

            ViewData["jsData"] = new ListPageModel(section, PageType.Shows);
            return View(ViewData["jsData"]);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("{section}/watching")]
        public ActionResult<List<ShowModel>> Watching(SiteSection section)
        {
            return service.CurrentlyWatching(User.Obj(), section);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("{section}/notstarted")]
        public ActionResult<List<ShowModel>> NotStarted(SiteSection section)
        {
            return service.NotStarted(User.Obj(), section);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("{section}/all")]
        public ActionResult<List<ShowModel>> AllShows(SiteSection section)
        {
            return service.ShowsAndLists(User.Obj(), section);
        }

        [HttpGet("{section}/search")]
        public ViewResult Search(SiteSection section, string q)
        {
            ViewBag.q = q;
            ViewData["jsData"] = new ListPageModel(section, PageType.Search, service.Search(section, q));
            return View(nameof(Index), ViewData["jsData"]);
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
            ViewData["jsData"] = new ShowPageModel(section, show, service.Recommenders(User.Obj()), service.SomeEpisodesInList(show));
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
        public ActionResult<Show> SaveSettings(SiteSection section, string showId, [FromBody] ShowSettings model)
        {
            Show? show = service.UpdateSettings(section, showId, model, User.Obj());
            if (show != null)
            {
                return show;
            }
            return NotFound();

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