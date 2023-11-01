using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    public class TVNetwork
    {
        [Key]
        [Required]
        public uint NetworkId { get; set; }
        [MaxLength(255)]
        public string? Name { get; set; }
        [MaxLength(2)]
        public string? CountryCode { get; set; }
        [MaxLength(1024)]
        public string? HomepageUrl { get; set; }
        [MaxLength(1024)]
        public string? SearchUrl { get; set; }
    }
}
