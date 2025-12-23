using System.Runtime.Serialization;
using WCKDRZR.Gaspar;

namespace MediaLife.Models
{
    [ExportFor(GasparType.TypeScript)]
    public enum PlayLocation
    {
        [EnumMember(Value = "server")]
        Server,
        [EnumMember(Value = "client")]
        Client,
    }
}
