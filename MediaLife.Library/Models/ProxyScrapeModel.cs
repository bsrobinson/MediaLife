using System.Collections.Generic;
using System.Text.Json.Serialization;
using Newtonsoft.Json;

namespace MediaLife.Library.Models;

public class ProxyScrapeModel
{
    public List<ProxyModel> Proxies { get; set; } = [];
}

public class ProxyModel
{
    public bool Alive { get; set; }

    [JsonPropertyName("last_seen")]
    public double LastSeen { get; set; }

    public required string Proxy { get; set; }
}