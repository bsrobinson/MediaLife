# MediaLife

Your total solution to keep track of your TV, Movies and Books.

There are two main elements to MediaLife; the first is very much like the services it uses for it's data ([TV Maze](https://www.tvmaze.com) and [The Movie Database](https://www.themoviedb.org/?language=en-GB)), keeping track of your progress through TV shows and Movie and Book series - and popping up when new content is released, but with some advantages:

- **You own the data**.  This does mean you have to store it, but you own it and have full control over where it goes; should any of the source services shutdown, you still have your data and this app can just me migrated to a new source.

- **Build custom lists of entertainment** across all data sources.  Watch an episode, a  movie then read a book.

- **Family viewing modes** (coming soon)

The second element to MediaLife is the way it can hook into your MediaLibrary.  I will show you what files you have and allow you to play the files on your media server running [VLC](https://www.videolan.org).  It will also use PirateBay to obtain new files and automatically delete them after marked as watched.

## Running MediaLife

MediaLife is based on the [AspNetMvcWebpack-Template](https://github.com/bsrobinson/AspNetMvcWebpack-Template/), see their readme for more information on how that works.

The basic steps are:

1. **Create the secrets file**
   Create a file called `MediaLife/MediaLife/secrets.json` with the following content:
   
   ```json
   {
     "ConnectionStrings": {
       "MySql": "your_mysql_connection_string"
     }
   }
   ```
   
   *The database and tables will be created on the first run.*

2. **Launch the website**
   From the root of the application, run:
   
   ```bash
   npm start
   ```
   
   *requires dotnet, node and npm.*

3. **Add some shows**
   Use the search to find shows and add them to your list.

## Authentication

When running the application locally (on url host `localhost`) there is no login required; however if you publish the code to a public domain/ip you will need to login.  The process is a little unusual, but means than your 'known devices' will always just connect without the friction of login pages.

Create an environment variable on the host server with the name `AUTH_KEY` and your 'password' in the value.  This is any string you like.

When you connect to the site, you will be presented with a page that only has a password input box; enter your password there - it will be sorted in a cookie (named `auth_key`) and that will persist your login until you cycle the password.

## Media Library

To hook into a media library you simply need to call `/Update/client` on the website with your list of files.

Have a look at `/MediaLife/Media Server/macos/Update.sh` this is a bash script written for macos, it supplies the files on the server in the correct format to the update script and correctly handles the response.

In my setup this is scheduled to run every 10 minutes to keep everything in sync.

In the body of your POST request to `/Update/client/` you supply data with the following headers:

```
START_GROUP:SETTINGS
START_GROUP:FILES:TV
START_GROUP:FILES:MOVIES
START_GROUP:TORRENTS
```

**Under `START_GROUP:SETTINGS`** you will add the settings for example:

```
START_GROUP:SETTINGS
UnwatchedTag: Blue
```

**Under `START_GROUP:FILES:TV`** and `START_GROUP:FILES:MOVIES` you will add paths to the files in your library, for example:

```
START_GROUP:FILES:TV
/Users/marvin/TV Shows/M*A*S*H S09E03.mkv
```

After each path, after a tab (`\t`) you can provide a comma separated list of file tags

**Under `START_GROUP:TORRENTS`** add a list of each torrent currently downloading on the server.  Each line is a tab separated list of data, for example:

```
START_GROUP:TORRENTS
HASH    FILE_NAME    PERCENT_COMPLETE    FILES
```

each file in the `FILES`column is prefix with `FILE:`

In reply to this, the web-app will return a similar file with the following headings:

```
START_GROUP:DELETE_TORRENTS
START_GROUP:SAVE_&_DELETE_TORRENTS:TV
START_GROUP:SAVE_&_DELETE_TORRENTS:MOVIES
START_GROUP:ADD_TORRENTS
START_GROUP:DELETE_FILES
START_GROUP:RETAG_FILES
START_GROUP:DOWNLOAD_FILES_FROM_CLOUD
```

**Under `START_GROUP:DELETE_TORRENTS`** will be a list of torrent hashes that can be deleted.
**Under `START_GROUP:SAVE_&_DELETE_TORRENTS:TV`** and **`START_GROUP:SAVE_&_DELETE_TORRENTS:MOVIES`** will be a list of torrent files to save.  It will be in the following tab separated columns: `Hash`, `File in Torrent`, `Destination Folder`, `Destination File Name`.
**Under `START_GROUP:ADD_TORRENTS`** will be a list of torrents to start downloading.  It will be in the following tab separated columns: `Hash`, `Name`.
**Under `START_GROUP:DELETE_FILES`** will be a list of file paths to delete.
**Under `START_GROUP:RETAG_FILES`** will be a list of file paths to re-tag.  It will be in the following tab separated columns: `File Path`, `Target Tag List (comma separated)`.
**Under `START_GROUP:DOWNLOAD_FILES_FROM_CLOUD`** will be a list of file paths to request download from the cloud (and be ready to play).
