using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [ExportFor(GasparType.TypeScript)]
    [PrimaryKey(nameof(UserId), nameof(ListId))]
    public class UserList
    {
        public uint UserId { get; set; }
        
        public uint ListId { get; set; }
    }
}