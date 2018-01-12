class SettingsTesterList{
    constructor(container, config, opt) {
        this._containerSelector = container;
        this.opt = Object.assign({}, opt);

        this._DOMContainer = document.querySelector(this._containerSelector);
        if (!this._DOMContainer) throw ('Fail to retrieve container with selector : "' + this._containerSelector + '".');
        this._datasourceURL = null;
        this._datasourceCache = null;
        this.onChange = function(){};
        this.sortFunction = null; // default to use basic _sort function
        this.beta = false;
        this._config = config;
        this._scriptname = '';
        this._scriptversion = '';
    }

    setScript(scriptname, scriptversion){
        this._scriptname = scriptname;
        this._scriptversion = scriptversion;
        this._setDataSourceURL(this._config.scriptApiSettingURL + '/' + this._scriptname + '/' + this._scriptversion);
    }

    _getAddTesterURL(uid){
        return this._datasourceURL + '/' + uid;
    }

    _setDataSourceURL(url) {
        this._datasourceURL = url;
        return this._updateDataSource()
            .then(this._build.bind(this));
    }

    _updateDataSource() {
        return new Promise((resolve, reject) => {
            $.getJSON(this._datasourceURL, data => {
                if (data.status !== 'success')      return reject('Failed to fetch url : ' + JSON.stringify(data));
                this._datasourceCache = data.data;
                if (this._datasourceCache.hasOwnProperty('beta')){
                    this.beta = (this._datasourceCache.beta == 'true');
                } else {
                    this.beta = false;
                }
                return resolve();
            });
        });
    }

    _build() {
        let c = this._DOMContainer;
        let textContent;
        if (this.beta){
            textContent = 'Beta';
        } else {
            textContent = 'Production';
        }
        let cssClass = this.beta ? 'beta-mode--beta' : 'beta-mode--production';

        let html = '<div class="col-md-12">';
        html += this._buildTesterList();
        html += '</div>';
        html += '<div class="col-md-12">';
        html += this._buildAddTester();
        html += '</div>';
        c.innerHTML = html;
        this._registerEvents();
    }

    _buildTesterList() {
        let html = '';
        let testers = this._datasourceCache.testers;
        if (testers.length > 0) {
            for (let i = 0; i < testers.length; i++) {
                let testerName = testers[i];
                html += '<div class="row">';
                html += '  <div class="col-md-12">';
                html += '    ' + testerName;
                html += '  </div>';
                html += '</div>';
            }
        } else {
            html += 'No Testers yet !';
        }
        return html;
    }

    _buildAddTester(){
        let html = '';
        html +=  '<div class="row">';
        html +=  '    <input type="text" width="35" class="col-md-5" placeholder="Hostname ID to add to Beta"></input>';
        html +=  '    <button id="settings-btn-add-host-to-beta" class="col-md-2">Add</button>';
        html +=  '</div>';
        return html;
    }

    _registerEvents(){
        $('#settings-btn-add-host-to-beta').on('click', this._onClickAddTester.bind(this));
    }

    _onClickAddTester(e){
        let uid = $($(e.target).siblings()[0]).val();
        if (uid !== ''){
            this._addTester(uid);
        }
    }

    _addTester(uid){
        let url = this._getAddTesterURL(uid);
        let data = {};
        $.ajax({
            url: url,
            type: 'PUT',
            data: data
        })
        .then(this._updateDataSource.bind(this))
        .then(this._build.bind(this));
    }
}
