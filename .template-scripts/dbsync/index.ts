import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ReadConfig } from '../~shared/Config';
import { spawn } from 'child_process';

let connection_string = ReadConfig().dbSyncConnectionString;
if (!connection_string) {

	let filePath = join(__dirname, '../../../secrets.json');
	if (existsSync(filePath)) {
		try {
			let appSecrets = JSON.parse(readFileSync(filePath, { encoding: 'utf8' }));
			connection_string = appSecrets.ConnectionStrings.MySql;
		}
		catch { }
	}
}

if (connection_string) {
		
	let runArgs = [
		'run', 
		'--project', join(__dirname, '../../../../DbContextSync/DbContextSync/DbContextSync.csproj'),
		'--context', join(__dirname, '../../../*.Library/DAL/**/*.cs'),
		'--database', connection_string,
	];
	spawn('dotnet', runArgs, { stdio: 'inherit' })

}