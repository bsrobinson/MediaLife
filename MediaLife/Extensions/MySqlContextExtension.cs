using System;
using System.Linq;
using MediaLife.Library.DAL;

namespace MediaLife.Extensions
{
	public static class MySqlContextExtension
    {
        public static void Log(this MySqlContext db, Guid sessionId, string message, Exception? exception = null)
        {
            db.Log.Add(new Log
            {
                SessionId = sessionId.ToString(),
                Timestamp = DateTime.Now,
                Message = message,
                Error = exception != null,
                StackTrace = exception?.StackTrace,
                Emailed = false,
            });
            db.SaveChanges();
        }

        public static void LogPayloadReceived(this MySqlContext db, string receivedPayload)
        {
            LoggedPayload entry = db.LoggedPayloads.First();
            entry.Received = $"{{\"timestamp\":\"{DateTime.Now:F}\", \"payload\": {receivedPayload}}}";
            db.SaveChanges();
        }

        public static void LogPayloadReply(this MySqlContext db, string replyPayload)
        {
            LoggedPayload entry = db.LoggedPayloads.First();
            entry.Reply = $"{{\"timestamp\":\"{DateTime.Now:F}\", \"payload\": {replyPayload}}}";
            db.SaveChanges();
        }
    }
}

