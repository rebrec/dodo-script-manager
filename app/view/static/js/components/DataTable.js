class DataTable {
    constructor(container, opt) {
        this._containerSelector = container;
        this.opt = opt || { };
        this._DOMContainer = document.querySelector(this._containerSelector);
        if (!this._DOMContainer) throw ('Fail to retrieve container with selector : "' + this._containerSelector + '".');
        this._datasourceURL = null;
        this._datasourceCache = null;
        this.onRemove = function(){};
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
                if (typeof data.data.length !== 'number')   return reject('Retrieved data is not an Array! (no length property)');

                this._datasourceCache = data.data;
                return resolve();
            });
        });
    }

    _build() {
        let c = this._DOMContainer;
        let html = '';

        for (let i = 0; i < this._datasourceCache.length; i++) {
            let hostObj = this._datasourceCache[i];
            html += '                <div class="highlightable bottom-line row" data-hostname="' + hostObj.hostname + '">';
            html += '                    <div class="col-xs-6 field-hostname">';
            html += '                        ' + hostObj.hostname;
            html += '                    </div>';
            html += '                    <div class="col-xs-4">';
            html += '                        ' + hostObj.recordTimestamp;
            html += '                    </div>';
            html += '                    <div class="col-xs-2"><span class="pull-right glyphicon glyphicon-remove datatable-remove-btn"></span>';
            html += '                        ' + hostObj.executed;
            html += '                    </div>';
            html += '                </div>';
        }

        c.innerHTML = html;
        let selectSelector = '.datatable-remove-btn';
        let selectNode = $(selectSelector);
        selectNode.on('click', this._onRemoveBtnClick.bind(this));
    }

    _onRemoveBtnClick(e) {
        let selectedName = $(e.target).parent('div').parent('div').data('hostname');
        this.onRemove(selectedName);
    }
}