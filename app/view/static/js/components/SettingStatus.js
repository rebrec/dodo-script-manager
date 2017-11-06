class SettingStatus {
    constructor(container, opt) {
        this._containerSelector = container;
        this.opt = Object.assign({
            }, opt);
        this._DOMContainer = document.querySelector(this._containerSelector);
        if (!this._DOMContainer) throw ('Fail to retrieve container with selector : "' + this._containerSelector + '".');
        this._datasourceURL = null;
        this._datasourceCache = null;
        this.onChange = function(){};
        this.sortFunction = null; // default to use basic sort function
    }

    setDataSourceURL(url) {
        this._datasourceURL = url;
        return this._updateDataSource()
            .then(this._build.bind(this));
    }

    _updateDataSource() {
        return new Promise((resolve, reject) => {
            $.getJSON(this._datasourceURL, data => {
                if (data.status !== 'success')      return reject('Failed to fetch url : ' + JSON.stringify(data));
                this._datasourceCache = data.data;
                return resolve();
            });
        });
    }

    _build() {
        let c = this._DOMContainer;
        let textContent;
        if (this._datasourceCache.hasOwnProperty('beta')){
            textContent = 'Script en mode mode Beta (fonctionnement inverse)';
        } else {
            textContent = 'Script en mode Production';
        }
        let html = '';
        html += '<div class="row" id="beta-mode">';
        html += '  <div class="col-lg-12" id="beta-mode">';
        html += '    ' + textContent;
        html += '  </div>';
        html += '</div>';
        c.innerHTML = html;
    }
}
