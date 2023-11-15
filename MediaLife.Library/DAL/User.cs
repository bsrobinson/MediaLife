using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(UserId))]
    public class User
    {
        public uint UserId { get; set; }

        public required uint AccountId { get; set; }

        [MaxLength(255)]
        public required string Name { get; set; }

        [MaxLength(255)]
        public required string Password { get; set; }

        [Column(TypeName = "nvarchar(12)")]
        public required UserRole Role { get; set; }
    }

    [ExportFor(GasparType.TypeScript)]
    public enum UserRole
    {
        [EnumMember(Value = "User")]
        User,
        [EnumMember(Value = "Account Admin")]
        AccountAdmin,
        [EnumMember(Value = "Site Admin")]
        SiteAdmin,
    }
}