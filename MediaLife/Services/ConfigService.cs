using System.Collections.Generic;
using System.Linq;
using MediaLife.Library.DAL;

namespace MediaLife.Services
{
    public class ConfigService
    {
        private MySqlContext db;

        private List<Config> config = new();

        private bool loaded;

        public ConfigService(MySqlContext context)
        {
            db = context;
        }

        private void Load()
        {
            if (!loaded)
            {
                config = db.Config.ToList();
                loaded = true;
            }
        }

        public string? GetString(string key)
        {
            Load();
            Config? entry = config.SingleOrDefault(k => k.Key == key);
            if (entry != null)
            {
                return entry.Value;
            }
            return null;
        }

        public bool GetBool(string key)
        {
            return GetBoolOrNull(key) ?? false;
        }

        public bool? GetBoolOrNull(string key)
        {
            Load();
            Config? entry = config.SingleOrDefault(k => k.Key == key);
            if (entry != null)
            {
                string value = entry.Value.ToLower();
                return value.StartsWith("t") || value.StartsWith("1");
            }
            return null;
        }

        public int GetInt(string key)
        {
            return GetIntOrNull(key) ?? 0;
        }

        public int? GetIntOrNull(string key)
        {
            Load();
            Config? entry = config.SingleOrDefault(k => k.Key == key);
            if (entry != null)
            {
                if (int.TryParse(entry.Value, out int parsed))
                {
                    return parsed;
                }
            }
            return null;
        }
    }
}