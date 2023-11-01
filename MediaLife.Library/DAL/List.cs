using System;
using System.ComponentModel.DataAnnotations;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    public class List
    {
        [Key]
        [Required]
        public uint ListId { get; set; }
        
        [MaxLength(255)]
        public required string Name { get; set; }

        public required DateTime Created { get; set; }

    }
}
