module.exports = function (db) {

    const express = require('express');
    const app = express();
    const bodyParser = require('body-parser');
    const config = require('../config');

    const ScriptEnumerator = require('./models/ScriptEnumerator')(db);
    const ScriptVersionEnumerator = require('./models/ScriptVersionEnumerator')(db);
    const ScriptData = require('./models/ScriptData')(db);
    const ScriptSettings = require('./models/ScriptSettings')(db);

    const nunjucks = require('nunjucks');

    app.use('/vendor/jquery', express.static(config.projectRoot + '/node_modules/jquery/dist/'));
    app.use('/vendor/bootstrap', express.static(config.projectRoot + '/node_modules/bootstrap/dist/'));
    app.use('/vendor/tether', express.static(config.projectRoot + '/node_modules/tether/dist/'));
    app.use('/vendor/font-awesome', express.static(config.projectRoot + '/node_modules/font-awesome/'));
    app.use(express.static(config.projectRoot + '/app/view/static'));

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    nunjucks.configure(config.projectRoot + '/app/view/templates', {
        autoescape: true,
        express: app
    });

    const routerApi = express.Router();
    const router = express.Router();

    router.route('/')
        .get(function (req, res) {
            res.render('index.html', {
                title: 'DODO (Script Manager)'
            });
        });
    router.route('/settings/script/:script_name/:script_version')
        .get(function (req, res) {
            let scriptName = req.params.script_name;
            let scriptVersion = req.params.script_version;
            let scriptSettings = new ScriptSettings(scriptName, scriptVersion);
            scriptSettings.getScriptSettings()
                .then(data => {
                    data.scriptName = scriptName;
                    data.scriptVersion = scriptVersion;
                    res.render('settings.html', {
                        title: 'Script Settings',
                        settings: JSON.stringify(data)
                    });
                })
                .catch(err => {
                    res.render('error.html', {
                        err: err
                    });
                });
        });


    routerApi.route('/script')
        .get(function (req, res) {
            let result = {status: 'fail'};
            let scriptEnumerator = new ScriptEnumerator();
            scriptEnumerator.listScripts()
                .then(data => {
                    result.status = 'success';
                    result.data = data;
                    return res.json(result);
                })
                .catch(err => {
                    result.message = 'An error occured';
                    return res.json(result);
                });
        });

    routerApi.route('/script/:script_name')
        .get(function (req, res) {
            let result = {status: 'fail'};
            let scriptName = req.params.script_name;
            if (!scriptName) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }

            let scriptVersionEnumerator = new ScriptVersionEnumerator(req.params.script_name);
            scriptVersionEnumerator.listVersions()
                .then(data => {
                    result.status = 'success';
                    result.data = data;
                    return res.json(result);
                })
                .catch(err => {
                    result.message = 'An error occured';
                    return res.json(result);
                });
        });

    routerApi.route('/script/settings/:script_name/:script_version')   // SETTINGS
        .get(function (req, res) {
            let result = {status: 'fail'};
            let scriptName = req.params.script_name;
            let scriptVersion = req.params.script_version;
            if (!scriptName || !scriptVersion) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }

            let scriptSettings = new ScriptSettings(scriptName, scriptVersion);
            scriptSettings.getScriptSettings()
                .then(data => {
                    result.status = 'success';
                    // data.scriptName = scriptName;
                    // data.scriptVersion = scriptVersion;
                    result.data = data;
                    return res.json(result);
                })
                .catch(err => {
                    result.message = 'An error occured';
                    return res.json(result);
                });
        })
        .post(function (req, res) {
            let result = {status: 'fail'};
            let scriptName = req.params.script_name;
            let scriptVersion = req.params.script_version;
            if (!scriptName || !scriptVersion) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }

            let settings = Object.assign({}, req.body);
            let scriptSettings = new ScriptSettings(scriptName, scriptVersion);
            scriptSettings._setScriptSettings(settings)
                .then(data => {
                    result.status = 'success';
                    result.data = data;
                    return res.json(result);
                })
                .catch(err => {
                    result.message = 'An error occured' + err;
                    return res.json(result);
                });
        });

    routerApi.route('/script/settings/:script_name/:script_version/:uid')   // SETTINGS Testers
        .put(function (req, res) {
            let result = {status: 'fail'};
            let scriptName = req.params.script_name;
            let scriptVersion = req.params.script_version;
            let uid = req.params.uid;
            let additionnalData = Object.assign({}, req.body);
            // delete additionalParams.script_name;
            // delete additionalParams.script_version;
            // delete additionalParams.hostname;

            if (!scriptName || !scriptVersion || !uid) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }

            let scriptSettings = new ScriptSettings(scriptName, scriptVersion);
            return scriptSettings.addTester(uid)
                .then(data => {
                    result.status = 'success';
                    result.data = data || '';
                    return res.status(201).json(result);
                })
                .catch(err => {
                    result.message = 'An error occured';
                    return res.status(501).json(result);
                });
        })
        .delete(function (req, res) {
            let result = {status: 'fail'};
            let scriptName = req.params.script_name;
            let scriptVersion = req.params.script_version;
            let uid = req.params.uid;
            let additionnalData = Object.assign({}, req.body);
            // delete additionalParams.script_name;
            // delete additionalParams.script_version;
            // delete additionalParams.hostname;

            if (!scriptName || !scriptVersion || !uid) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }

            let scriptSettings = new ScriptSettings(scriptName, scriptVersion);
            return scriptSettings.delTester(uid)
                .then(data => {
                    result.status = 'success';
                    result.data = data || '';
                    return res.status(201).json(result);
                })
                .catch(err => {
                    result.message = 'An error occured';
                    return res.status(501).json(result);
                });
        });


    routerApi.route('/script/:script_name/:script_version')
        .get(function (req, res) {
            let result = {status: 'fail'};
            let scriptName = req.params.script_name;
            let scriptVersion = req.params.script_version;
            if (!scriptName || !scriptVersion) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }

            let scriptData = new ScriptData(scriptName, scriptVersion);
            scriptData.listHosts()
                .then(data => {
                    result.status = 'success';
                    result.data = data;
                    return res.json(result);
                })
                .catch(err => {
                    result.message = 'An error occured';
                    return res.json(result);
                });
        });

    routerApi.route('/script/:script_name/:script_version/:hostname')
        .get(function (req, res) {
            let result = {status: 'fail'};
            let scriptName = req.params.script_name;
            let scriptVersion = req.params.script_version;
            let hostname = req.params.hostname;
            if (!scriptName || !scriptVersion || !hostname) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }

            let scriptData = new ScriptData(scriptName, scriptVersion);
            let scriptSettings = new ScriptSettings(scriptName, scriptVersion);
            return scriptSettings.getScriptSettings()
                .then(settings=> {
                    if (settings.beta == 'true') {
                        if (settings.testers.indexOf(hostname) > -1) { // if beta and tester
                            return scriptData.isAlreadyExecuted(hostname)
                        } else { // if beta and not tester
                            return scriptData.updateLastCheckTimestamp(hostname)
                                .then(_ => {
                                    return true;  // true = already Executed which mean that it won't execute
                                });
                        }
                    } else {
                        return scriptData.isAlreadyExecuted(hostname)
                    }
                })
                .then(data=> {
                    result.status = 'success';
                    result.data = data;
                    return res.json(result);

                })
                .catch(err => {
                    result.message = 'An error occured';
                    return res.json(result);
                });
        })

        .delete(function (req, res) {
            let result = {status: 'fail'};
            let scriptName = req.params.script_name;
            let scriptVersion = req.params.script_version;
            let hostname = req.params.hostname;
            if (!scriptName || !scriptVersion || !hostname) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }

            let scriptData = new ScriptData(scriptName, scriptVersion);
            scriptData.clearExecutionStatus(hostname)
                .then(data => {
                    result.status = 'success';
                    result.data = '';
                    return res.json(result);
                })
                .catch(err => {
                    result.message = 'An error occured';
                    return res.json(result);
                });
        })

        .put(function (req, res) {
            let result = {status: 'fail'};
            let scriptName = req.params.script_name;
            let scriptVersion = req.params.script_version;
            let hostname = req.params.hostname;
            let additionnalData = Object.assign({}, req.body);
            // delete additionalParams.script_name;
            // delete additionalParams.script_version;
            // delete additionalParams.hostname;

            if (!scriptName || !scriptVersion || !hostname) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }
            let executed = true;
            // could be better implemented (reuse additionnalData for transmitting execution status to ease feature implementation (add the possibility to save-execution status to send logs and additionnal data but note that the status is not good (false))
            if (additionnalData.hasOwnProperty('executed')) {
                executed = additionnalData.executed;
                delete additionnalData.executed;
            }

            let scriptData = new ScriptData(scriptName, scriptVersion);
            return scriptData.recordExecution(hostname, additionnalData, executed)
                .then(data => {
                    result.status = 'success';
                    result.data = '';
                    return res.status(201).json(result);
                })
                .catch(err => {
                    result.message = 'An error occured';
                    return res.status(501).json(result);
                });
        });


// all of our routes will be prefixed with /api
    app.use('/', router);
    app.use('/api', routerApi);

// START THE SERVER
// =============================================================================

    return app;

};