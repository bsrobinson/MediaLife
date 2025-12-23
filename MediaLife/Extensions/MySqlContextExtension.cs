using System;
using System.Linq;
using MediaLife.Library.DAL;

namespace MediaLife.Extensions
{
	public static class MySqlContextExtension
    {
        public static void Log(this MySqlContext db, Guid sessionId, string message)
        {
            db.Log.Add(new Log
            {
                SessionId = sessionId.ToString(),
                Timestamp = DateTime.Now,
                Message = message,
                Error = false,
                StackTrace = null,
                Emailed = false,
            });
            db.SaveChanges();
        }
        
        public static void Log(this MySqlContext db, Guid sessionId, Exception exception, string? messagePrefix = null)
        {
            string message = exception.Message;
            string stackTrace = exception.StackTrace ?? "";

            if (exception.InnerException != null)
            {
                message = exception.InnerException.Message;
                stackTrace = $"{stackTrace}\n\nInner Exception: {exception.InnerException.Message}\n{exception.InnerException.StackTrace}";
            }
            if (messagePrefix != null) { message = $"{messagePrefix} - {message}"; }

            db.Log.Add(new Log
            {
                SessionId = sessionId.ToString(),
                Timestamp = DateTime.Now,
                Message = message,
                Error = true,
                StackTrace = stackTrace,
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

