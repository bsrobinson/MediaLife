"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const Config_1 = require("../~shared/Config");
const child_process_1 = require("child_process");
let connection_string = (0, Config_1.ReadConfig)().dbSyncConnectionString;
if (!connection_string) {
    let filePath = (0, path_1.join)(__dirname, '../../../secrets.json');
    if ((0, fs_1.existsSync)(filePath)) {
        try {
            let appSecrets = JSON.parse((0, fs_1.readFileSync)(filePath, { encoding: 'utf8' }));
            connection_string = appSecrets.ConnectionStrings.MySql;
        }
        catch { }
    }
}
if (connection_string) {
    let runArgs = [
        'run',
        '--project', (0, path_1.join)(__dirname, '../../../../DbContextSync/DbContextSync/DbContextSync.csproj'),
        '--context', (0, path_1.join)(__dirname, '../../../*.Library/DAL/**/*.cs'),
        '--database', connection_string,
    ];
    (0, child_process_1.spawn)('dotnet', runArgs, { stdio: 'inherit' });
}
