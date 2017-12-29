let path = require('path');
let dbBaseName = (process.env.NODE_ENV !== 'test') ? 'db': path.join('test', 'db');

let dbScriptDataFilename = path.join(__dirname, dbBaseName + 'ScriptData');
let dbSettingsFilename = path.join(__dirname, dbBaseName + 'Settings');

module.exports = {
    dbScriptDataFilename: dbScriptDataFilename,
    dbSettingsFilename: dbSettingsFilename,
    projectRoot: __dirname,
    port: 8088 
};