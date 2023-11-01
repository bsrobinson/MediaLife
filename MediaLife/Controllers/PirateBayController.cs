using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using System.Linq;
using MediaLife.Attributes;
using MediaLife.Services;
using MediaLife.Models;
using System;
using WCKDRZR.Gaspar;

namespace MediaLife.Controllers
{
    [Authenticate]
    public class PirateBayController : Controller
    {
        private MySqlContext db;

        public PirateBayController(MySqlContext context)
        {
            db = context;
        }

        [HttpGet("[controller]")]
        public IActionResult Index()
        {
            ViewData["jsData"] = db.Piratebay.OrderByDescending(p => p.Active).ToList();
            return View();
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]")]
        public ActionResult<PirateBay> Add([FromBody] string newUrl)
        {
            PirateBay piratebay = new PirateBay { Url = newUrl, Active = true, ResultsInLastRun = 0 };
            db.Piratebay.Add(piratebay);
            db.SaveChanges();

            return Ok(piratebay);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPut("[controller]/{id}")]
        public ActionResult<bool> Activate(uint id)
        {
            PirateBay? piratebay = db.Piratebay.SingleOrDefault(p => p.Id == id);
            if (piratebay == null)
            {
                return NotFound();
            }

            foreach (PirateBay pirateBay in db.Piratebay.ToList())
            {
                pirateBay.Active = pirateBay.Id == id;
            }
            db.SaveChanges();

            return true;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpDelete("[controller]/{id}")]
        public ActionResult<PirateBay> Delete(uint id)
        {
            PirateBay? piratebay = db.Piratebay.SingleOrDefault(p => p.Id == id);
            if (piratebay == null)
            {
                return NotFound();
            }

            db.Piratebay.Remove(piratebay);
            db.SaveChanges();

            return Ok(piratebay);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("[controller]/[action]/{id}")]
        public ActionResult<bool> Test(uint id)
        {
            PirateBay? piratebay = db.Piratebay.SingleOrDefault(p => p.Id == id);
            if (piratebay == null)
            {
                return NotFound();
            }

            ClientService clientService = new(db, Guid.NewGuid());
            ClientTorrent? torrent = clientService.SearchForTorrent(piratebay, null, new()).Result;

            return torrent?.TorrentResultCount > 0 ? true : Problem("Test failed", null, 424);
        }
    }
}