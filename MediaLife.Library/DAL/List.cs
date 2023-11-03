using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(ListId))]
    [ExportFor(GasparType.TypeScript)]
    public class List
    {
        public required uint ListId { get; set; }
        
        [MaxLength(255)]
        public required string Name { get; set; }

        public required DateTime Created { get; set; }

    }
}
