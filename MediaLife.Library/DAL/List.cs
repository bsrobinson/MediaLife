using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(ListId))]
    public class List
    {
        public uint ListId { get; set; }

        [MaxLength(255)]
        public required string Name { get; set; }

        public required DateTime Created { get; set; }

    }
}