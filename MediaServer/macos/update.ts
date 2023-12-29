//Requires:
//	brew install tag (https://github.com/jdberry/tag)
//	brew install transmission (https://transmissionbt.com/)
//	brew install yt-dlp

import { execSync } from 'child_process';
import { ClientActions, ClientData, ClientFile, ClientTorrent, SiteSection } from './cs-models';
const homedir = require('os').homedir();

const tvFolder = `${homedir}/Library/Mobile Documents/com~apple~CloudDocs/Media/TV Shows`;
const moviesFolder = `${homedir}/Library/Mobile Documents/com~apple~CloudDocs/Media/Movies`;
const youtubeFolder = `${homedir}/Library/Mobile Documents/com~apple~CloudDocs/Media/YouTube`;

const tvAppRootUrl = 'https://_medialife_webapp_homepage';
const unwatchedTag = 'Blue';
const torrentLabel = 'Purple';

function exec(command: string) {
	try {
		return execSync(command, { encoding: 'utf8' });
	}
	catch {
		return '';
	}
}

function getFilesInFolder(section: SiteSection, folder: string): ClientFile[] {

	let spotlightFiles = convertTagLines(section, exec(`/usr/local/bin/tag --find '*' '${folder}' -t`));
	spotlightFiles.push(...convertTagLines(section, exec(`/usr/local/bin/tag --find '' '${folder}' -t`)));
	
	let findFiles = convertFindLines(section, exec(`find '${folder}' -type f`));
	
	if (spotlightFiles.length > findFiles.length) {
	
		return spotlightFiles;
	
	} else {
	
		// Problem with spotlight (machine is prob indexing), use this slower find method
		findFiles.forEach(file => {
			if (file.path) {
				file.tags = exec(`/usr/local/bin/tag -l -N '${file.path.replace(/'/g, `'\\''`)}'`).trim().split(',');
			}
		});
		return findFiles;
	}
}

function getTorrents(): ClientTorrent[] {

	let torrents: ClientTorrent[] = [];

	exec('/usr/local/bin/transmission-remote -l').split('\n').forEach(line => {	
		let id = line.trim().split(' ')[0];
		if (id) {
			let info = exec(`/usr/local/bin/transmission-remote -t ${id} -i`)
			if (info) {

				if ((info.match(/\n.*?Labels: (.*)\n/) || [])[1] == torrentLabel) {
				
					let percentComplete = parseFloat((info.match(/\n.*?Percent Done: (.*)\n/) || [])[1]);
					
					let torrent = {
						hash: (info.match(/\n.*?Hash: (.*)\n/) || [])[1],
						torrentName: (info.match(/\n.*?Name: (.*)\n/) || [])[1],
						percentComplete: isNaN(percentComplete) ? 0 : percentComplete,
						files: [] as string[],
					} as ClientTorrent;

					let namePos = 0;
					exec(`/usr/local/bin/transmission-remote -t "${id}" -f`).split('\n').forEach(fileLine => {
						if (fileLine && namePos > 0) {
							torrent.files.push(fileLine.slice(namePos))
						}
						else if (fileLine.trim().slice(0, 1) == '#' && fileLine.indexOf('Name') > 0) {
							namePos = fileLine.indexOf('Name');
						}
					});

					torrents.push(torrent);
				}
			}
		}
	});
	return torrents;
}

function convertTagLines(section: SiteSection, lines: string): ClientFile[] {
	let files: ClientFile[] = [];
	lines.split('\n').forEach(line => {
		if (line) {
			let columns = line.split('\t');
			if (columns.length == 2) {
				files.push({
					fileType: section,
					path: columns[0],
					tags: columns[1].trim().split(','),
				} as ClientFile);
			}
		}
	});
	return files;
}
function convertFindLines(section: SiteSection, lines: string): ClientFile[] {
	let files: ClientFile[] = [];
	lines.split('\n').forEach(line => {
		if (line) {
			files.push({
				fileType: section,
				path: line,
				tags: [] as string[],
			} as ClientFile);
		}
	});
	return files;
}


console.log('Building data to send to server');

let clientData: ClientData  = {
	files: [
		...getFilesInFolder(SiteSection.TV, tvFolder),
		...getFilesInFolder(SiteSection.Movies, moviesFolder),
		...getFilesInFolder(SiteSection.YouTube, youtubeFolder),
	],
	torrents: getTorrents(),
	unwatchedTag: unwatchedTag,
};

console.log(`Sending to server (${tvAppRootUrl}/Update/client)`);

fetch(`${tvAppRootUrl}/Update/client`, { method: 'POST', body: JSON.stringify(clientData), headers: { 'Content-Type': 'application/json' } }).then(async response => {
	if (response.ok) {

		console.log('Server response received OK');

		let clientActions = await response.json() as ClientActions;
		if (clientActions.error) {
			
			console.error(clientActions.error);
			
		} else {
		
			console.log(`${clientActions.deleteTorrents.length} x deleteTorrents`);
			clientActions.deleteTorrents.forEach(torrent => {
				console.log(`  • ${torrent.show?.name} - ${torrent.episode?.seriesEpisodeNumber} ${torrent.episode?.name}`);
				exec(`/usr/local/bin/transmission-remote -t "${torrent.hash}" -rad > /dev/null`)
			});


			console.log(`${clientActions.saveAndDeleteTorrents.length} x saveAndDeleteTorrents`);
			clientActions.saveAndDeleteTorrents.forEach(torrent => {
				let root = '';
				if (torrent.show?.siteSection == SiteSection.TV) { root = tvFolder; }
				if (torrent.show?.siteSection == SiteSection.Movies) { root = moviesFolder; }
				if (root) {
					let info = exec(`/usr/local/bin/transmission-remote -t ${torrent.hash} -i`);
					if (info) {
						console.log(`  • ${torrent.show?.name} - ${torrent.episode?.seriesEpisodeNumber} ${torrent.episode?.name}`);
					
						let location = (info.match(/\n.*?Location: (.*)\n/) || [])[1];
						let source = `${location}/${torrent.videoFile}`;
						let destFolder = `${root}${torrent.destinationFolder}`;
						let destFile = torrent.destinationFileName;

						if (!torrent.videoFile) {
							source = `${location}/${torrent.torrentName}`;
							destFolder = `${root}${torrent.destinationFolder}/${torrent.destinationFileName}/`;
							destFile = '';
						}
						exec(`mkdir -p "${destFolder}" && cp -R "${source}" "${destFolder}/${destFile}"`);
						exec(`/usr/local/bin/tag -a "Orange,${unwatchedTag}" "${destFolder}/${destFile}"`);
						exec(`/usr/local/bin/transmission-remote -t "${torrent.hash}" -rad > /dev/null`);
					}
				}
			});

			
			console.log(`${clientActions.addTorrents.length} x addTorrents`);
			clientActions.addTorrents.forEach(torrent => {
				console.log(`  • ${torrent.show?.name} - ${torrent.episode?.seriesEpisodeNumber} ${torrent.episode?.name}`);
				exec(`/usr/local/bin/transmission-remote -a "magnet:?xt=urn:btih:${torrent.hash}&dn=${torrent.torrentName}" > /dev/null`);
				exec(`/usr/local/bin/transmission-remote -t "${torrent.hash}" -L "${torrentLabel}" > /dev/null`);
			});

			
			let skipping = clientActions.downloads.length - 10;
			console.log(`${clientActions.downloads.length - (skipping > 0 ? skipping : 0)} x downloads${skipping > 0 ? ` (skipping ${skipping} more)` : ''}`);
			clientActions.downloads.slice(0, 10).forEach(torrent => {
				if (torrent.episode?.siteSection == SiteSection.YouTube) {
					console.log(`  • ${torrent.show?.name} - ${torrent.episode?.seriesEpisodeNumber} ${torrent.episode?.name}`);
					exec(`/usr/local/bin/yt-dlp -o "${youtubeFolder}${torrent.destinationFolder}/${torrent.destinationFileName}.mp4" -f mp4 "https://www.youtube.com/watch?v=${torrent.episode.id}" > /dev/null`);
				}
			});

			
			console.log(`${clientActions.deleteFiles.length} x deleteFiles`);
			clientActions.deleteFiles.forEach(file => {
				if (file.episode) {
					console.log(`  • ${file.show?.name} - ${file.episode?.seriesEpisodeNumber} ${file.episode?.name}`);
					exec(`rm "${file.episode.filePath}"`);
				}
			});

			
			console.log(`${clientActions.retagFiles.length} x retagFiles`);
			clientActions.retagFiles.forEach(file => {
				if (file.path) {
					console.log(`  • ${file.show?.name} - ${file.episode?.seriesEpisodeNumber} ${file.episode?.name}`);
					exec(`/usr/local/bin/tag -s "${file.tags.join(',')}" "${file.path}"`);
				}
			});

			
			console.log(`${clientActions.downloadFileFromCloud.length} x downloadFileFromCloud`);
			clientActions.downloadFileFromCloud.forEach(file => {
				console.log(`  • ${file.filePath}`);
				exec(`brctl download "${file.filePath}"`);
			});

		}
	} else {
		console.error('Error receiving response');
		console.log(response);
	}
});