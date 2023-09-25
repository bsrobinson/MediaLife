using System;
using Microsoft.EntityFrameworkCore;

namespace MediaLife.Library.DAL
{
    public class MySqlContext : DbContext
    {
		public MySqlContext(DbContextOptions<MySqlContext> options) : base(options)
        {
			//this.Database.EnsureCreated();
		}

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);
            //multiple primary keys:
            modelBuilder.Entity<Show>().HasKey(s => new { s.ShowId, s.SiteSection });
            modelBuilder.Entity<Episode>().HasKey(e => new { e.EpisodeId, e.SiteSection });
            modelBuilder.Entity<ListEntry>().HasKey(l => new { l.ListId, l.EpisodeId, l.SiteSection });
        }

		//Tables
		public virtual DbSet<Config> Config { get; set; }
        public virtual DbSet<Episode> Episodes { get; set; }
        public virtual DbSet<List> Lists { get; set; }
        public virtual DbSet<ListEntry> ListEntries { get; set; }
        public virtual DbSet<Log> Log { get; set; }
        public virtual DbSet<LoggedPayload> LoggedPayloads { get; set; }
		public virtual DbSet<Show> Shows { get; set; }
        public virtual DbSet<PirateBay> Piratebay { get; set; }
        public virtual DbSet<Torrent> Torrents { get; set; }
        public virtual DbSet<TVNetwork> TVNetworks { get; set; }
    }
}
