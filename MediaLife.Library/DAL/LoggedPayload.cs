using System;
using System.ComponentModel.DataAnnotations;

namespace MediaLife.Library.DAL
{
    public class LoggedPayload
    {
        [Key]
        public required uint Id { get; set; }

        public string? Received { get; set; }
        
        public string? Reply { get; set; }
    }
}
