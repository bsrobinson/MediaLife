using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(AccountId))]
    public class Account
    {
        [Key]
        public uint AccountId { get; set; }

        [MaxLength(255)]
        public required string Name { get; set; }
    }
}
