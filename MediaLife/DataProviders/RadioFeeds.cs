using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using MediaLife.Library.DAL;
using MediaLife.Library.Models;
using MediaLife.Models;

namespace MediaLife.DataProviders
{
    public class RadioFeeds
    {
        public RadioFeeds(MySqlContext context)
        {
        }

        public async Task<List<ShowModel>> SearchAsync(string query)
        {
            string searchPage = await new HttpClient().GetStringAsync($"http://www.radiofeeds.co.uk/query.asp?feedme={query}");

            var stationRows = new Regex(@"<tr.*?</tr>", RegexOptions.Singleline)
                .Matches(searchPage)
                .Select(s => s.Value)
                .Where(s => s.Contains("Listen Live:"));

            List<ShowModel> radioFeeds = new();
            foreach (string stationRow in stationRows)
            {
                Match idMatch = new Regex(@"lsn.to/(.*?)""").Match(stationRow);
                Match nameMatch = new Regex(@"<a href=""(.*?)"".*?>(.*?)<").Match(stationRow);
                Match streamMatch = new Regex(@"<a href=""(.*?)""", RegexOptions.RightToLeft).Match(stationRow);
                if (idMatch.Success && nameMatch.Success && streamMatch.Success)
                {
                    radioFeeds.Add(new()
                    {
                        Id = idMatch.Groups[1].Value,
                        SiteSection = SiteSection.Radio,
                        Name = nameMatch.Groups[2].Value,
                        Episodes =
                        [
                            new()
                            {
                                Id = idMatch.Groups[1].Value,
                                SiteSection = SiteSection.Radio,
                                Name = nameMatch.Groups[2].Value,
                                FilePath = streamMatch.Groups[1].Value,
                            }
                        ]
                    });
                }
            }

            return radioFeeds;
        }

        public async Task<ShowModel?> GetRadioStationAsync(string stationId)
        {
            string stationPage = new HttpClient().GetStringAsync($"http://lsn.to/{stationId}").Result;
            Match searchMatch = new Regex(@"\?search=(.*?)""").Match(stationPage);
            if (searchMatch.Success)
            {
                List<ShowModel> searchResults = await SearchAsync(searchMatch.Groups[1].Value);
                return searchResults.FirstOrDefault(s => s.Id == stationId);
            }

            return null;
        }
    }
}