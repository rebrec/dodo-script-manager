class SettingsBetaToggle{
    constructor(container, config, opt) {
        this._containerSelector = container;
        this.opt = Object.assign({}, opt);
        this._clickSelector = 'settings-beta-toggle';

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

        let html = '';
        html += '  <div class="col-md-6">Script Mode : </div>';
        html += '  <div class="col-md-6 ' + cssClass + '" id="' + this._clickSelector + '">';
        html += '    ' + textContent;
        html += '  </div>';
        c.innerHTML = html;
        let selectSelector = '#' + this._clickSelector;
        let selectNode = $(selectSelector);
        selectNode.on('click', this._onClick.bind(this));
    }

    _toggle(){
        this.beta = !this.beta
        let data = {beta: this.beta};
        $.ajax({
            url: this._datasourceURL,
            type: 'POST',
            data: data
        })
            .then(res=> {
                this._updateDataSource();
            });
    }

    _onClick(e) {
        this._toggle();
        this._build(); // for fast rendering
    }
}
