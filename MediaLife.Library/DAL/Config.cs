using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(Key))]
    public class Config
    {
        [MaxLength(100)]
        public required string Key { get; set; }

        [MaxLength(255)]
        public required string Value { get; set; }

    }
}