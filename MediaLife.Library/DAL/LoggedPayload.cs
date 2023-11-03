using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(Id))]
    public class LoggedPayload
    {
        public required uint Id { get; set; }

        public string? Received { get; set; }
        
        public string? Reply { get; set; }
    }
}
