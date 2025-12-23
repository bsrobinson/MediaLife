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
using System.Xml.Serialization;
using System.IO;
using MediaLife.HtmlHelpers.Extensions;
using Microsoft.AspNetCore.Http;

namespace MediaLife.Controllers
{
    [Authorised]
    [ExportFor(GasparType.TypeScript)]
    public class VLCController : Controller
    {
        private readonly ConfigService _configSrv;
        private readonly ShowsService _showsSrv;
        private readonly PlayLocation _playLocation;
        private readonly string _streamName;

        public VLCController(MySqlContext context, IHttpContextAccessor httpContext)
        {
            _configSrv = new(context);
            _showsSrv = new(context);

            string? cookieValue = null;
            httpContext.HttpContext?.Request.Cookies.TryGetValue("play_location", out cookieValue);
            _playLocation = cookieValue == PlayLocation.Client.DisplayName() ? PlayLocation.Client : PlayLocation.Server;

            string? streamName = null;
            httpContext.HttpContext?.Request.Cookies.TryGetValue("vlc_stream_name", out streamName);
            if (streamName == null)
            {
                _streamName = $"{Guid.NewGuid():n}";
                httpContext.HttpContext?.Response.Cookies.Append("vlc_stream_name", _streamName);
            }
            else
            {
                _streamName = streamName;
            }
        }


        [HttpGet("[controller]")]
        public ActionResult<VLCStatus?> Status()
        {
            if (_playLocation == PlayLocation.Server)
            {
                return StatusPage();
            }
            if (_playLocation == PlayLocation.Client)
            {
                return StreamStatusPage();
            }
            return BadRequest();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Open([FromQuery] string path)
        {
            if (_playLocation == PlayLocation.Server)
            {
                Close();
                StatusPage("command=in_play&input=" + HttpUtility.UrlEncode(path.Replace("+", "␚")).Replace("+", " ").Replace("␚", "+"));
                return StatusPage();
            }
            if (_playLocation == PlayLocation.Client)
            {
                StreamCommand($"command=new%20{_streamName}%20broadcast%20enabled%20input%20%22file%3A%2F%2F{path}%22%20output%20%23transcode%7Bvcodec%3DFLV1%2Cvb%3D4096%2Cfps%3D25%2Cscale%3D1%2Cacodec%3Dmp3%2Cab%3D512%2Csamplerate%3D44100%2Cchannels%3D2%7D%3Astd%7Baccess%3Dhttp%2Cmux%3Dffmpeg%7B%7Bmux%3Dflv%7D%7D%2Cdst%3D0.0.0.0%3A8082%2F{_streamName}%7D");
                return Play();
            }
            return BadRequest();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Close()
        {
            if (_playLocation == PlayLocation.Server)
            {
                StatusPage("command=pl_empty");
                return StatusPage();
            }
            if (_playLocation == PlayLocation.Client)
            {
                return StreamCommand($"command=del%20{_streamName}");
            }
            return BadRequest();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Play()
        {
            if (_playLocation == PlayLocation.Server)
            {
                return StatusPage("command=pl_forceresume");
            }
            if (_playLocation == PlayLocation.Client)
            {
                return StreamCommand($"command=control%20{_streamName}%20play");
            }
            return BadRequest();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Pause()
        {
            if (_playLocation == PlayLocation.Server)
            {
                return StatusPage("command=pl_forcepause");
            }
            if (_playLocation == PlayLocation.Client)
            {
                return StreamCommand($"command=control%20{_streamName}%20pause");
            }
            return BadRequest();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Fullscreen()
        {
            if (_playLocation == PlayLocation.Server)
            {
                return StatusPage("command=fullscreen");
            }
            return BadRequest();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> Skip()
        {
            if (_playLocation == PlayLocation.Server)
            {
                return StatusPage("command=seek&val=+30");
            }
            if (_playLocation == PlayLocation.Client)
            {
                return StreamCommand($"command=control%20{_streamName}%20seek%20+30");
            }
            return BadRequest();
        }

        [HttpGet("[controller]/[action]")]
        public ActionResult<VLCStatus?> SkipBack()
        {
            if (_playLocation == PlayLocation.Server)
            {
                return StatusPage("command=seek&val=-30");
            }
            if (_playLocation == PlayLocation.Client)
            {
                return StreamCommand($"command=control%20{_streamName}%20seek%20-30");
            }
            return BadRequest();
        }

        [HttpGet("[controller]/[action]/{percent}")]
        public ActionResult<VLCStatus?> SeekTo(int percent)
        {
            if (_playLocation == PlayLocation.Server)
            {
                return StatusPage("command=seek&val=" + percent + "%");
            }
            if (_playLocation == PlayLocation.Client)
            {
                return StreamCommand($"command=control%20{_streamName}%20seek%20{percent}%");
            }
            return BadRequest();
        }


        private VLCStatus? StatusPage(string? qs = null)
        {
            string? statusResponse = GetVLCData("requests/status.json", qs);
            if (statusResponse != null)
            {
                JsonSerializerSettings settings = new() { Converters = new List<JsonConverter> { new BooleanJsonConverter() } };
                VLCStatus? status = JsonConvert.DeserializeObject<VLCStatus>(statusResponse, settings);
                if (status != null)
                {
                    string? filename = status.Information?.Category?.Meta?.Filename;
                    if (filename == null)
                    {
                        string? playlistResponse = GetVLCData("requests/playlist.json");
                        if (playlistResponse != null)
                        {
                            VLCPlaylist? playlist = JsonConvert.DeserializeObject<VLCPlaylist>(playlistResponse, settings);
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
                    status.Show = GetShow(filename);
                }

                return status;
            }
            return null;
        }

        private VLCStatus? StreamCommand(string? qs = null)
        {
            GetVLCData("requests/vlm_cmd.xml", qs);
            return StreamStatusPage();
        }
        
        private VLCStatus? StreamStatusPage()
        {
            string? statusResponse = GetVLCData("requests/vlm.xml");
            if (statusResponse != null)
            {
                XmlSerializer serializer = new(typeof(VLCStreamStatus));
                using (StringReader reader = new(statusResponse))
                {
                    
                    var streamStatus = (VLCStreamStatus?)serializer.Deserialize(reader);
                    var stream = streamStatus?.Broadcast?.Instances.Instance.FirstOrDefault();

                    string? filename = streamStatus?.Broadcast?.Inputs.Input;
                    if (filename != null)
                    {
                        filename = filename[(filename.LastIndexOf("/") + 1)..];
                    }

                    VLCStatus? status = stream == null ? new() : new()
                    {
                        State = stream.State,
                        Time = stream.Time / 1000000,
                        Length = stream.Length / 1000000,
                        Position = (float)stream.Position,
                        Fullscreen = false,
                        Information = new() { Category = new() { Meta = new() { 
                            Filename = filename
                        }}},
                        Show = GetShow(filename),
                    };

                    return status;
                }
            }
            return null;
        }

        public ShowModel? GetShow(string? filename)
        {
            if (filename == null)
            {
                return null;
            }
            return _showsSrv.GetShowForFileName(filename);
        }

        private string? GetVLCData(string path, string? qs = null)
        {
            string? address = _configSrv.Config.UserConfig.VLCConfig.Address;
            string? password = _configSrv.Config.UserConfig.VLCConfig.Password;

            if (address != null)
            {
                HttpClient httpClient = new();
                httpClient.DefaultRequestHeaders.Add("Authorization", "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(":" + password)));

                if (!string.IsNullOrEmpty(qs) && !qs.StartsWith("?"))
                {
                    qs = "?" + qs;
                }

                try
                {
                    return httpClient.GetStringAsync($"{address}{path}{qs ?? ""}").Result;
                }
                catch { }
            }

            return null;
        }
    }
}