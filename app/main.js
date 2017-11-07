
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

    app.use('/vendor/jquery', express.static(__dirname + '/../node_modules/jquery/dist/'));
    app.use('/vendor/bootstrap', express.static(__dirname + '/../node_modules/bootstrap/dist/'));
    app.use(express.static('view/static'));

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    nunjucks.configure('view/templates', {
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


    routerApi.route('/script/settings/:script_name/:script_version')
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
            scriptSettings.setScriptSettings(settings)
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
            scriptData.isAlreadyExecuted(hostname)
                .then(data =>{
                    let scriptSettings = new ScriptSettings(scriptName, scriptVersion);
                    return scriptSettings.getScriptSettings()
                        .then(setting =>{
                            if (setting.beta){
                                data = (setting.beta === true) ? !data : data
                            }
                            return data
                        })
                })
                .then(data => {
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
            if (!scriptName || !scriptVersion || !hostname) {
                result.message = 'Invalid Parameter';
                return res.json(result);
            }
            let executed = true;
            let scriptSettings = new ScriptSettings(scriptName, scriptVersion);
            scriptSettings.getScriptSettings()
                .then(data=>{
                    if (data.hasOwnProperty('beta') && data.beta === true){
                        executed = false;
                    }
                })
                .then(_=>{
                    let scriptData = new ScriptData(scriptName, scriptVersion);
                    return scriptData.recordExecution(hostname, executed)
                })
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