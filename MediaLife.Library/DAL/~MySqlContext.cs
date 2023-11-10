using Microsoft.EntityFrameworkCore;

namespace MediaLife.Library.DAL
{
    public class MySqlContext : DbContext
    {
        public MySqlContext(DbContextOptions<MySqlContext> options) : base(options) { }

        public virtual DbSet<Account> Accounts { get; set; }
        public virtual DbSet<Config> Config { get; set; }
        public virtual DbSet<Episode> Episodes { get; set; }
        public virtual DbSet<ListEntry> ListEntries { get; set; }
        public virtual DbSet<List> Lists { get; set; }
        public virtual DbSet<Log> Log { get; set; }
        public virtual DbSet<LoggedPayload> LoggedPayloads { get; set; }
        public virtual DbSet<PirateBay> PirateBay { get; set; }
        public virtual DbSet<Show> Shows { get; set; }
        public virtual DbSet<Torrent> Torrents { get; set; }
        public virtual DbSet<TvNetwork> TvNetworks { get; set; }
        public virtual DbSet<User> Users { get; set; }

	}
}
