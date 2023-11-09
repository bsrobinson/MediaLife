using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(UserId))]
    [ExportFor(GasparType.TypeScript)]
    public class User
    {
        [Key]
        public uint UserId { get; set; }

        public required uint AccountId { get; set; }

        [MaxLength(255)]
        [DisplayName("Display Name")]
        public required string Name { get; set; }

        [MaxLength(255)]
        [DisplayName("Pass Key")]
        public required string Password { get; set; }
    }
}
