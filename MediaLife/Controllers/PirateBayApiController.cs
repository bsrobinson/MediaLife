using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using System.Linq;
using MediaLife.Attributes;
using MediaLife.Services;
using MediaLife.Models;
using System;
using System.Collections.Generic;
using WCKDRZR.Gaspar;

namespace MediaLife.Controllers
{
    [Authenticate]
    public class PirateBayApiController : Controller
    {
        private MySqlContext db;

        public PirateBayApiController(MySqlContext context)
        {
            db = context;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("[controller]")]
        public ActionResult<List<PirateBay>> Get()
        {
            return db.PirateBay.OrderByDescending(p => p.Active).ToList();;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]")]
        public ActionResult<PirateBay> Add([FromBody] string newUrl)
        {
            PirateBay piratebay = new PirateBay { Url = newUrl, Active = false, ResultsInLastRun = 0, ConsecutiveErrors = 0 };
            db.PirateBay.Add(piratebay);
            db.SaveChanges();

            return piratebay;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPut("[controller]/{id}")]
        public ActionResult<bool> Activate(uint id)
        {
            PirateBay? piratebay = db.PirateBay.SingleOrDefault(p => p.Id == id);
            if (piratebay == null)
            {
                return NotFound();
            }

            foreach (PirateBay pirateBay in db.PirateBay.ToList())
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
            PirateBay? piratebay = db.PirateBay.SingleOrDefault(p => p.Id == id);
            if (piratebay == null)
            {
                return NotFound();
            }

            db.PirateBay.Remove(piratebay);
            db.SaveChanges();

            return piratebay;
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpGet("[controller]/[action]/{id}")]
        public ActionResult<bool> Test(uint id)
        {
            PirateBay? piratebay = db.PirateBay.SingleOrDefault(p => p.Id == id);
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