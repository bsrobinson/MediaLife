using System;
using System.Linq;
using MediaLife.Library.DAL;

namespace MediaLife.Extensions
{
	public static class MySqlContextExtension
    {
        public static void Log(this MySqlContext db, Guid sessionId, string message, bool isError = false)
        {
            db.Log.Add(new Log
            {
                SessionId = sessionId.ToString(),
                Timestamp = DateTime.Now,
                Message = message,
                Error = isError,
                Emailed = false,
            });
            db.SaveChanges();
        }

        public static void LogPayloadReceived(this MySqlContext db, string receivedPayload)
        {
            LoggedPayload entry = db.LoggedPayloads.First();
            entry.Received = string.Format("{0:F}", DateTime.Now) + "\n\n" + receivedPayload;
            db.SaveChanges();
        }

        public static void LogPayloadReply(this MySqlContext db, string replyPayload)
        {
            LoggedPayload entry = db.LoggedPayloads.First();
            entry.Reply = string.Format("{0:F}", DateTime.Now) + "\n\n" + replyPayload;
            db.SaveChanges();
        }
    }
}

