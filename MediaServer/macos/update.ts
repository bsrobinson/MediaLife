//Requires:
//	brew install tag (https://github.com/jdberry/tag)
//	brew install transmission (https://transmissionbt.com/)
//	brew install yt-dlp

import { execSync } from 'child_process';
import { ClientActions, ClientData, ClientFile, ClientTorrent, PirateBayTorrent, SiteSection } from './cs-models';
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

	console.log(`Getting files in ${folder}`)
	
	let findFiles = convertFindLines(section, exec(`/usr/bin/find '${folder}' -type f`));
	
	findFiles.forEach(file => {
		if (file.path) {
			const path = file.path.replace(/'/g, `'\\''`)
			file.tags = exec(`/opt/homebrew/bin/tag -l -N '${path}'`).trim().split(',');
			file.inCloud = exec(`/bin/ls -lO '${path}'`).includes('dataless');
			if (!file.inCloud) {
				file.durationSeconds = parseFloat(exec(`/opt/homebrew/bin/ffprobe -i '${path}' -show_entries format=duration -v quiet -of csv="p=0"`).trim())
			}
		}
	});
	console.log(`Found files: ${findFiles.length}`)
	return findFiles;
}

function getTorrents(): ClientTorrent[] {

	let torrents: ClientTorrent[] = [];

	exec('/opt/homebrew/bin/transmission-remote -l').split('\n').forEach(line => {	
		let id = line.trim().split(' ')[0];
		if (id) {
			let info = exec(`/opt/homebrew/bin/transmission-remote -t ${id} -i`)
			if (info) {

				if ((info.match(/\n.*?Labels: (.*)\n/) || [])[1] == torrentLabel) {
				
					let percentComplete = parseFloat((info.match(/\n.*?Percent Done: (.*)\n/) || [])[1]);
					
					let torrent = {
						hash: (info.match(/\n.*?Hash: (.*)\n/) || [])[1],
						name: (info.match(/\n.*?Name: (.*)\n/) || [])[1],
						percentComplete: isNaN(percentComplete) ? 0 : percentComplete,
						files: [] as string[],
					} as PirateBayTorrent;

					let namePos = 0;
					exec(`/opt/homebrew/bin/transmission-remote -t "${id}" -f`).split('\n').forEach(fileLine => {
						if (fileLine && namePos > 0) {
							torrent.files.push(fileLine.slice(namePos))
						}
						else if (fileLine.trim().slice(0, 1) == '#' && fileLine.indexOf('Name') > 0) {
							namePos = fileLine.indexOf('Name');
						}
					});

					torrents.push({torrents: [torrent]} as ClientTorrent);
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
		
			console.log(`${clientActions.deleteTorrents.flatMap(t => t.torrents).length} x deleteTorrents`);
			clientActions.deleteTorrents.forEach(clientTorrent => {
				clientTorrent.torrents.forEach(torrent => {
					console.log(`  • ${clientTorrent.showName} - ${clientTorrent.seriesEpisodeNumber} ${clientTorrent.episodeName}`);
					exec(`/opt/homebrew/bin/transmission-remote -t "${torrent.hash}" -rad > /dev/null`)
				})
			});


			console.log(`${clientActions.saveAndDeleteTorrents.length} x saveAndDeleteTorrents`);
			clientActions.saveAndDeleteTorrents.forEach(clientTorrent => {
				let root = '';
				if (clientTorrent.section == SiteSection.TV) { root = tvFolder; }
				if (clientTorrent.section == SiteSection.Movies) { root = moviesFolder; }

				let torrent = clientTorrent.torrents[0]
				let videoFile = clientTorrent.videoFiles[0]
				let destinationFileName = clientTorrent.destinationFileNames[0]

				if (root && torrent && destinationFileName) {
					let info = exec(`/opt/homebrew/bin/transmission-remote -t ${torrent.hash} -i`);
					if (info) {
						console.log(`  • ${clientTorrent.showName} - ${clientTorrent.seriesEpisodeNumber} ${clientTorrent.episodeName}`);
					
						let location = (info.match(/\n.*?Location: (.*)\n/) || [])[1];
						let source = `${location}/${videoFile}`;
						let destFolder = `${root}${clientTorrent.destinationFolder}`;
						let destFile = destinationFileName;

						if (!videoFile) {
							source = `${location}/${torrent.name}`;
							destFolder = `${root}${clientTorrent.destinationFolder}/${destinationFileName}/`;
							destFile = '';
						}
						exec(`mkdir -p "${destFolder}" && cp -R "${source}" "${destFolder}/${destFile}"`);
						exec(`/opt/homebrew/bin/tag -a "Orange,${unwatchedTag}" "${destFolder}/${destFile}"`);
						exec(`/opt/homebrew/bin/transmission-remote -t "${torrent.hash}" -rad > /dev/null`);
					}
				}
			});

			
			console.log(`${clientActions.addTorrents.flatMap(t => t.torrents).length} x addTorrents`);
			clientActions.addTorrents.forEach(clientTorrent => {
				clientTorrent.torrents.forEach(torrent => {
					console.log(`  • ${clientTorrent.showName} - ${clientTorrent.seriesEpisodeNumber} ${clientTorrent.episodeName}`);
					exec(`/opt/homebrew/bin/transmission-remote -a "magnet:?xt=urn:btih:${torrent.hash}&dn=${torrent.name}" > /dev/null`);
					exec(`/opt/homebrew/bin/transmission-remote -t "${torrent.hash}" -L "${torrentLabel}" > /dev/null`);
				})
			});

			
			let skipping = clientActions.downloads.length - 10;
			console.log(`${clientActions.downloads.length - (skipping > 0 ? skipping : 0)} x downloads${skipping > 0 ? ` (skipping ${skipping} more)` : ''}`);
			clientActions.downloads.slice(0, 10).forEach(file => {
				console.log(`  • ${file.showName} - ${file.seriesEpisodeNumber} ${file.episodeName}`);
				exec(`/opt/homebrew/bin/yt-dlp -o "${youtubeFolder}${file.destinationFolder}/${file.destinationFileName}.mp4" -f mp4 "${file.url}" > /dev/null`);
			});

			
			console.log(`${clientActions.deleteFiles.length} x deleteFiles`);
			clientActions.deleteFiles.forEach(file => {
				if (file.episode) {
					console.log(`  • ${file.show?.name} - ${file.episode?.seriesEpisodeNumber} ${file.episode?.name}`);
					exec(`rm "${file.episode.filePath}"`);
				}
			});

			
			console.log(`${clientActions.reTagFiles.length} x reTagFiles`);
			clientActions.reTagFiles.forEach(file => {
				if (file.path) {
					console.log(`  • ${file.show?.name} - ${file.episode?.seriesEpisodeNumber} ${file.episode?.name}`);
					exec(`/opt/homebrew/bin/tag -s "${file.tags.join(',')}" "${file.path}"`);
				}
			});

			
			console.log(`${clientActions.downloadFileFromCloud.length} x downloadFileFromCloud`);
			clientActions.downloadFileFromCloud.forEach(file => {
				console.log(`  • ${file.filePath}`);
				exec(`/usr/bin/brctl download "${file.filePath}"`);
			});

			console.log('Done')

		}
	} else {
		console.error('Error receiving response');
		console.log(response);
	}
});