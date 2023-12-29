using Microsoft.EntityFrameworkCore;
using WCKDRZR.Gaspar;

namespace MediaLife.Library.DAL
{
    [PrimaryKey(nameof(Id))]
    [ExportFor(GasparType.TypeScript)]
    public class LoggedPayload
    {
        public uint Id { get; set; }

        public string? Received { get; set; }

        public string? Reply { get; set; }

    }
}