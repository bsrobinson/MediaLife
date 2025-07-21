using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using MediaLife.Attributes;
using MediaLife.Library.DAL;
using MediaLife.Models;
using MediaLife.Serializers;
using MediaLife.Services;
using WCKDRZR.Gaspar;
using System.Web;

namespace MediaLife.Controllers
{
    [Authorised]
    [ExportFor(GasparType.TypeScript)]
    public class VLCController : Controller
    {
        private ConfigService configSrv;
        private ShowsService showsSrv;

        public VLCController(MySqlContext context)
        {
            configSrv = new(context);
            showsSrv = new(context);
        }

        [HttpGet("[controller]")]
        public ActionResult<VLCStatus?> Status()
        {
            return StatusPage();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Open([FromQuery] string path)
        {
            Close();
            StatusPage("command=in_play&input=" + HttpUtility.UrlEncode(path.Replace("+", "␚")).Replace("+", " ").Replace("␚", "+"));
            return StatusPage();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Close()
        {
            StatusPage("command=pl_empty");
            return StatusPage();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Play()
        {
            return StatusPage("command=pl_forceresume");
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Pause()
        {
            return StatusPage("command=pl_forcepause");
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Fullscreen()
        {
            return StatusPage("command=fullscreen");
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Skip()
        {
            return StatusPage("command=seek&val=+30");
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> SkipBack()
        {
            return StatusPage("command=seek&val=-30");
        }

        [HttpGet("[controller]/[action]/{percent}")]
        public ActionResult<VLCStatus?> SeekTo(int percent)
        {
            return StatusPage("command=seek&val=" + percent + "%");
        }


        private VLCStatus? StatusPage(string? qs = null)
        {
            string? address = configSrv.Config.UserConfig.VLCConfig.Address;
            string? password = configSrv.Config.UserConfig.VLCConfig.Password;

            if (address != null)
            {
                HttpClient httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("Authorization", "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(":" + password)));

                if (!string.IsNullOrEmpty(qs) && !qs.StartsWith("?"))
                {
                    qs = "?" + qs;
                }

                HttpResponseMessage statusResponse = httpClient.GetAsync($"{address}requests/status.json{qs ?? ""}").Result;
                if (statusResponse.IsSuccessStatusCode)
                {
                    JsonSerializerSettings settings = new() { Converters = new List<JsonConverter> { new BooleanJsonConverter() } };
                    VLCStatus? status = JsonConvert.DeserializeObject<VLCStatus>(statusResponse.Content.ReadAsStringAsync().Result, settings);
                    if (status != null)
                    {
                        string? filename = status.Information?.Category?.Meta?.Filename;
                        if (filename == null)
                        {
                            HttpResponseMessage playlistResponse = httpClient.GetAsync($"{address}requests/playlist.json").Result;
                            if (playlistResponse.IsSuccessStatusCode)
                            {
                                VLCPlaylist? playlist = JsonConvert.DeserializeObject<VLCPlaylist>(playlistResponse.Content.ReadAsStringAsync().Result, settings);
                                VLCPlaylist_Leaf? leaf = playlist?.Children.FirstOrDefault()?.Children.FirstOrDefault();
                                if (leaf != null)
                                {
                                    filename = WebUtility.UrlDecode(leaf.Uri);
                                    if (filename != null)
                                    {
                                        filename = filename[(filename.LastIndexOf("/") + 1)..];
                                        status.Information = new() { Category = new() { Meta = new() { Filename = filename } } };
                                        status.Length = leaf.Duration;
                                    }
                                }
                            }
                        }
                        if (filename != null)
                        {
                            ShowModel? show = showsSrv.GetShowForFileName(filename);
                            if (show != null)
                            {
                                status.Show = show;
                            }
                        }
                    }

                    return status;
                }
            }
            return null;
        }
    }
}