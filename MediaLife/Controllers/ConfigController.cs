using Microsoft.AspNetCore.Mvc;
using MediaLife.Library.DAL;
using MediaLife.Attributes;
using MediaLife.Services;
using WCKDRZR.Gaspar;
using MediaLife.Models;
using System.Collections.Generic;

namespace MediaLife.Controllers
{
    [Authenticate]
    public class ConfigController : Controller
    {
        private ConfigService configSrv;

        public ConfigController(MySqlContext context)
        {
            configSrv = new(context);
        }

        [HttpGet("[controller]")]
        public IActionResult Index()
        {
            ViewData["jsData"] = configSrv;
            return View(configSrv.Config);
        }

        [ExportFor(GasparType.TypeScript)]
        [HttpPost("[controller]")]
        public ActionResult<Configuration> Update([FromBody] Dictionary<string, string> config)
        {
            configSrv.UpdateFromDictionary(config, save: true);
            return configSrv.Config;
        }
    }
}