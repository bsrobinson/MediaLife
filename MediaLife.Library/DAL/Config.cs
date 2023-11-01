using System;
using System.ComponentModel.DataAnnotations;

namespace MediaLife.Library.DAL
{
    public class Config
    {
        [Key]
        [MaxLength(100)]
        public required string Key { get; set; }

        [MaxLength(255)]
        public required string Value { get; set; }
    }
}
