using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using System.Linq;
using MediaLife.Attributes;
using System.Collections.Generic;
using MediaLife.Models;

namespace MediaLife.Controllers
{
    [Authorised]
    public class LogController : Controller
    {
        private MySqlContext db;

        public LogController(MySqlContext context)
        {
            db = context;
        }

        [HttpGet("[controller]")]
        public IActionResult Index()
        {
            LogModel model = new();

            List<Log> log = db.Log.ToList();
            foreach (Log entry in log)
            {
                LogSession? session = model.Sessions.FirstOrDefault(l => l.SessionId == entry.SessionId);
                if (session == null)
                {
                    session = new() { SessionId = entry.SessionId };
                    model.Sessions.Add(session);
                }

                session.Entries.Add(new LogEntry
                {
                    Id = entry.Id,
                    TimeStamp = entry.Timestamp,
                    Message = entry.Message,
                    Error = entry.Error,
                    Emailed = entry.Emailed
                });
            }
            model.SortSessions();

            ViewData["jsData"] = db.LoggedPayloads.OrderBy(p => p.Id).First();

            return View(model);
        }
    }
}