using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using System.Linq;
using MediaLife.Attributes;
using MediaLife.Models;
using Microsoft.AspNetCore.Http;
using MediaLife.Library.Models;

namespace MediaLife.Controllers
{
    [Authorised]
    public class PlayController : Controller
    {
        private readonly MySqlContext db;
        private readonly IHttpContextAccessor httpContext;

        public PlayController(MySqlContext context, IHttpContextAccessor httpContext)
        {
            db = context;
            this.httpContext = httpContext;
        }

        [HttpGet("[controller]/[action]/{section}/{episodeId}")]
        public IActionResult Episode(SiteSection section, string episodeId)
        {
            Episode? episode = db.Episodes.FirstOrDefault(e => e.EpisodeId == episodeId && e.SiteSection == section);
            if (episode == null)
            {
                return NotFound();
            }
            if (episode.FilePath == null)
            {
                return BadRequest();
            }
            Show? show = db.Shows.FirstOrDefault(s => s.ShowId == episode.ShowId && s.SiteSection == section);
            if (show == null)
            {
                return NotFound();
            }

            VLCController vlcController = new VLCController(db, httpContext);
            
            int openRetryCount = 0;
            while (openRetryCount < 10)
            {
                vlcController.OpenOnServer(episode.FilePath, show?.Volume);

                int statusRetryCount = 0;
                while (statusRetryCount < 10)
                {
                    VLCStatus? status = vlcController.StatusPage();
                    EpisodeModel? playingShow = status?.Show?.Episodes.ElementAtOrDefault(status.Show.EpisodeIndex);
                    if (playingShow?.Id == episodeId)
                    {
                        return Content("Done");
                    }
                    
                    statusRetryCount++;
                }

                openRetryCount++;
            }

            return Content("Failed");
        }
    }
}