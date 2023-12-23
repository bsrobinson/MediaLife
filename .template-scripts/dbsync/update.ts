import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ReadConfig } from '../~shared/Config';
import { spawn } from 'child_process';
import { executeCommand, git } from '../~shared/Command';


let folderPath = join(__dirname, 'tmp');

git(`clone https://github.com/bsrobinson/DbContextSync ${folderPath}`, true);

executeCommand(`dotnet build -c Release --project ${folderPath}/DbContextSync/DbContextSync.csproj -o ${folderPath}`);

