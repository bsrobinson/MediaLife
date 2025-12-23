using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using System.Linq;
using MediaLife.Attributes;
using MediaLife.Services;
using MediaLife.Models;
using System;
using System.Collections.Generic;
using WCKDRZR.Gaspar;
using System.Net.Http;

namespace MediaLife.Controllers
{
    [Authorised]
    public class TorrentSearchEngineApiController : Controller
    {
        private MySqlContext db;

        public TorrentSearchEngineApiController(MySqlContext context)
        {
            db = context;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("[controller]")]
        public ActionResult<List<TorrentSearchEngine>> Get()
        {
            return db.TorrentSearchEngines.OrderByDescending(p => p.Active).ToList();;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]/[action]")]
        public ActionResult<TorrentSearchEngine> AddPirateBay([FromBody] string newUrl)
        {
            TorrentSearchEngine torrentSearchEngine = new TorrentSearchEngine { Url = newUrl, Active = false, ResultsInLastRun = 0, ConsecutiveErrors = 0, Type = TorrentSearchEngineType.PirateBay };
            db.TorrentSearchEngines.Add(torrentSearchEngine);
            db.SaveChanges();

            return torrentSearchEngine;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]/[action]")]
        public ActionResult<TorrentSearchEngine> AddKnaben([FromBody] string newUrl)
        {
            TorrentSearchEngine torrentSearchEngine = new TorrentSearchEngine { Url = newUrl, Active = false, ResultsInLastRun = 0, ConsecutiveErrors = 0, Type = TorrentSearchEngineType.Knaben };
            db.TorrentSearchEngines.Add(torrentSearchEngine);
            db.SaveChanges();

            return torrentSearchEngine;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPut("[controller]/{id}")]
        public ActionResult<bool> Activate(uint id)
        {
            TorrentSearchEngine? torrentSearchEngine = db.TorrentSearchEngines.SingleOrDefault(p => p.Id == id);
            if (torrentSearchEngine == null)
            {
                return NotFound();
            }

            foreach (TorrentSearchEngine searchEngine in db.TorrentSearchEngines.ToList())
            {
                searchEngine.Active = searchEngine.Id == id;
            }
            db.SaveChanges();

            return true;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpDelete("[controller]/{id}")]
        public ActionResult<TorrentSearchEngine> Delete(uint id)
        {
            TorrentSearchEngine? torrentSearchEngine = db.TorrentSearchEngines.SingleOrDefault(p => p.Id == id);
            if (torrentSearchEngine == null)
            {
                return NotFound();
            }

            db.TorrentSearchEngines.Remove(torrentSearchEngine);
            db.SaveChanges();

            return torrentSearchEngine;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("[controller]/[action]/{id}")]
        public ActionResult<bool> Test(uint id)
        {
            TorrentSearchEngine? torrentSearchEngine = db.TorrentSearchEngines.SingleOrDefault(p => p.Id == id);
            if (torrentSearchEngine == null)
            {
                return NotFound();
            }

            var quickTest = new HttpClient().GetAsync($"{torrentSearchEngine.Url}").Result;
            if (!quickTest.IsSuccessStatusCode)
            {
                return StatusCode((int)quickTest.StatusCode);
            }

            ClientService clientService = new(db, Guid.NewGuid());
            ClientTorrent? torrent = clientService.SearchForTorrent(torrentSearchEngine, null, new()).Result;

            return torrent?.Torrents?.Count > 0 ? true : Problem("Test failed", null, 424);
        }
    }
}