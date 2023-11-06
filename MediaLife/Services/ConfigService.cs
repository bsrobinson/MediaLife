using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Reflection;
using MediaLife.Library.DAL;
using MediaLife.Models;
using Microsoft.EntityFrameworkCore;

namespace MediaLife.Services
{
    public class ConfigService
    {
        private MySqlContext _db;

        public Configuration Config { get; set; }

        public ConfigService(MySqlContext dbContext)
        {
            _db = dbContext;
            List<Config> dbConfig = _db.Config.ToList();

            Config = new();
            GetProperties(Config, (parentObject, property, configKey) => {
                
                Config? dbConfigEntry = dbConfig.FirstOrDefault(c => c.Key == configKey);
                if (dbConfigEntry != null)
                {
                    SetValueFromString(parentObject, property, dbConfigEntry.Value);
                }
                else
                {
                    DefaultValueAttribute? defaultValue = property.GetCustomAttribute(typeof(DefaultValueAttribute)) as DefaultValueAttribute;
                    if (defaultValue != null)
                    {
                        property.SetValue(parentObject, defaultValue.Value);
                    }
                }
            });
        }

        public void UpdateFromDictionary(Dictionary<string, string> keyValuePairs, bool save = false)
        {
            GetProperties(Config, (parentObject, property, configKey) => {

                if (keyValuePairs.ContainsKey(configKey))
                {
                    SetValueFromString(parentObject, property, keyValuePairs[configKey]);
                }
            });

            if (save)
            {
                SaveToDatabase();
            }
        }

        public void SaveToDatabase()
        {
            DbSet<Config> dbConfig = _db.Config;
            GetProperties(Config, (parentObject, property, configKey) => {

                Config? dbConfigEntry = dbConfig.FirstOrDefault(c => c.Key == configKey);

                DefaultValueAttribute? defaultAttribute = property.GetCustomAttribute(typeof(DefaultValueAttribute)) as DefaultValueAttribute;
                if (defaultAttribute != null)
                {
                    string? defaultValue = defaultAttribute.Value?.ToString();
                    string? currentValue = property.GetValue(parentObject)?.ToString();

                    if (currentValue != null && currentValue != defaultValue)
                    {
                        if (dbConfigEntry == null)
                        {
                            dbConfig.Add(new() { Key = configKey, Value = currentValue});
                        }
                        else if (dbConfigEntry.Value != currentValue)
                        {
                            dbConfigEntry.Value = currentValue;
                        }
                    }

                    if (dbConfigEntry != null && currentValue == defaultValue)
                    {
                        dbConfig.Remove(dbConfigEntry);
                    }
                }
            });

            _db.SaveChanges();
        }

        private void GetProperties(IConfiguration parentObject, Action<IConfiguration, PropertyInfo, string> action, string keyPrefix = "")
        {
            foreach (PropertyInfo prop in parentObject.GetType().GetProperties())
            {
                action(parentObject, prop, $"{keyPrefix}{prop.Name}");

                IConfiguration? propValue = prop.GetValue(parentObject) as IConfiguration;
                if (propValue != null)
                {
                    GetProperties(propValue, action, $"{keyPrefix}{prop.Name}.");
                }
            }
        }

        private void SetValueFromString(IConfiguration parentObject, PropertyInfo property, string value)
        {
            if (ushort.TryParse(value, out ushort number))
            {
                property.SetValue(parentObject, number);
            }
            else if (bool.TryParse(value, out bool boolean))
            {
                property.SetValue(parentObject, boolean);
            }
            else if (string.IsNullOrEmpty(value))
            {
                property.SetValue(parentObject, null);
            }
            else
            {
                property.SetValue(parentObject, value);
            }
        }
    }
}