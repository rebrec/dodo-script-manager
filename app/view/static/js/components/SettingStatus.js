class SettingStatus {
    constructor(container, config, opt) {
        this._containerSelector = container;
        this.opt = Object.assign({
            }, opt);

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
                    this.beta = this._datasourceCache.beta;
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
            textContent = 'Script en Beta (fonctionnement inverse)';
        } else {
            textContent = 'Script en Production';
        }
        let cssClass = (this.beta == 'true') ? 'beta-mode--beta' : 'beta-mode--production';

        let html = '';
        html += '<div class="row" id="beta-mode">';
        html += '  <div class="col-sm-11 ' + cssClass + '" id="beta-mode">';
        html += '    ' + textContent;
        html += '  </div>';
        html += '  <div class="col-sm-1 right ' + cssClass + '">';
        html += '    <a href="' + this._config.scriptSettingsURL + '/' + this._scriptname + '/' + this._scriptversion +'" class="fa fa-cog"></a>';
        html += '  </div>';
        html += '</div>';
        c.innerHTML = html;
    }
}
