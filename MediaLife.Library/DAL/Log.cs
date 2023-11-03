using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(Id))]
    public class Log
    {
        public required uint Id { get; set; }
        [MaxLength(36)]
        public required string SessionId { get; set; }
        public required DateTime Timestamp { get; set; }
        public required string Message { get; set; }
        public required bool Error { get; set; }
        public required bool Emailed { get; set; }
    }
}
