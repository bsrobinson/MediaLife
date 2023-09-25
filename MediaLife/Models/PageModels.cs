using System.Collections.Generic;
using System.Linq;
using MediaLife.Library.DAL;
using MediaLife.Library.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class ListPageModel
    {
        public ShowModelContext Context { get; set; }
        public List<ShowModel> Shows { get; set; } = new();

        public ListPageModel(SiteSection section, PageType page)
        {
            Context = new(section, page);
        }

        public ListPageModel(SiteSection section, PageType page, List<ShowModel> shows)
        {
            Context = new(section, page);
            Shows = shows;
        }
    }

    [ExportFor(GasparType.TypeScript)]
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class ShowPageModel
    {
        public SiteSection SiteSection { get; set; }
        public ShowModel Show { get; set; }

        public List<string> Recommenders { get; set; }
        public bool SomeEpisodesInList { get; set; }

        public bool ShowListOptions { get; set; }

        public ShowPageModel(SiteSection section, ShowModel show, List<string> recommenders, bool someEpisodesInList)
        {
            SiteSection = section;
            Show = show;

            Recommenders = recommenders;
            SomeEpisodesInList = someEpisodesInList;

            ShowListOptions = false;
            if (section == SiteSection.Lists)
            {
                //MODE SiteSection in List
                SiteSection = show.Episodes.GroupBy(e => e.SiteSection)
                    .OrderByDescending(g => g.Count())
                    .First().Key;
                ShowListOptions = true;
            }
        }
    }
}
