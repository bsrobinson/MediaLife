using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using Force.DeepCloner;
using MediaLife.Extensions;

namespace MediaLife.Models
{
    public class LogModel
    {
        public List<LogSession> Sessions { get; set; }

        public string? ReceivedPayload { get; set; }
        public string? ReplyPayload { get; set; }

        public LogModel()
        {
            Sessions = new();
        }

        public void SortSessions()
        {
            Sessions = Sessions.OrderByDescending(m => m.StartTimeStamp).ToList();
        }
    }

    public class LogSession
    {
        public string SessionId { get; set; } = "";
        public List<LogEntry> Entries { get; set; }

        public string? ReceivedPayload { get; set; }
        public string? ReplyPayload { get; set; }

        public DateTime StartTimeStamp => Entries.Min(e => e.TimeStamp);
        public bool HasError => Entries.Any(e => e.Error);
        public bool IsDone => Entries.Any(e => e.Message == "Done");

        public LogSession()
        {
            Entries = new();
        }
    }

    public class LogEntry
    {
        public uint Id { get; set; }
        public DateTime TimeStamp { get; set; }
        public string Message { get; set; } = "";
        public bool Error { get; set; }
        public bool Emailed { get; set; }
    }
}