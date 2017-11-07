const config = require('../config');
const dbLoader = require(config.projectRoot + '/app/models/db')(config);
let app;

dbLoader.loadAllDatabases()
    .then(function (db) {
        // call main app
        app = require('./main.js')(db);
        app.listen(config.port);
        console.log('Running on port ' + config.port);

    });
