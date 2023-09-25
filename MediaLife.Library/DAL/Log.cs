using System;
using System.ComponentModel.DataAnnotations;

namespace MediaLife.Library.DAL
{
    public class Log
    {
        [Key]
        [Required]
        public uint Id { get; set; }
        [MaxLength(36)]
        public required string SessionId { get; set; }
        public required DateTime Timestamp { get; set; }
        public required string Message { get; set; }
        public bool Error { get; set; }
        public bool Emailed { get; set; }
    }
}
