class DataTable {
    constructor(container, opt) {
        this._containerSelector = container;
        this.opt = opt || { };
        this._DOMContainer = document.querySelector(this._containerSelector);
        if (!this._DOMContainer) throw ('Fail to retrieve container with selector : "' + this._containerSelector + '".');
        this._datasourceURL = null;
        this._datasourceCache = null;
        this.onRemove = function(){};
        this._sortedKey = 'hostname'
        this._sortAscending = true;
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
    _sortDatasourceCache() {
        this._datasourceCache.sort((a, b)=> {
            let res;
            if (this._sortAscending) {
                res = (a[this._sortedKey] < b[this._sortedKey]) ? 1 : -1;
            } else {
                res = (a[this._sortedKey] < b[this._sortedKey]) ? -1 : 1;
            }
            return res;
        })
    }

    _sort(sortedKey) {
        if (!sortedKey || sortedKey === this._sortedKey) {
            this._sortAscending = !this._sortAscending;
        } else {
            this._sortedKey = sortedKey;
            this._sortAscending = true;
        }
        this._build();
    }

    _build() {
        this._sortDatasourceCache();

        let c = this._DOMContainer;
        let html = '';
        html += '<div class="row">';
        html += '    <h2 class="col-12-sp">';
        html += '        Total Count : ' + this._datasourceCache.length;
        html += '    </h2>';
        html += '</div>';
        // Header
        html += '                <div class="bottom-line row">';
        html += '                    <div class="col-xs-3 datatable-_sort-btn" data-columnname="hostname"><b>';
        html += '                        ' + 'Hostname';
        html += '                    </b></div>';
        html += '                    <div class="col-xs-3 datatable-_sort-btn" data-columnname="lastCheckTimestamp"><b>';
        html += '                        ' + 'Last Check Time';
        html += '                    </b></div>';
        html += '                    <div class="col-xs-3 datatable-_sort-btn" data-columnname="recordTimestamp"><b>';
        html += '                        ' + 'Execution Time';
        html += '                    </b></div>';
        html += '                    <div class="col-xs-3 datatable-_sort-btn" data-columnname="executed"><b>';
        html += '                        ' + 'Executed';
        html += '                    </b></div>';
        html += '                </div>';
        // Rows
        html += '                <div class="table-content">';
        for (let i = 0; i < this._datasourceCache.length; i++) {
            let hostObj = this._datasourceCache[i];
            html += '                <div class="highlightable bottom-line row" data-hostobj=\'' + JSON.stringify(hostObj) + '\'>';
            html += '                    <div class="col-xs-3 field-hostname">';
            html += '                        ' + hostObj.hostname;
            html += '                    </div>';
            html += '                    <div class="col-xs-3">';
            html += '                        ' + hostObj.lastCheckTimestamp;
            html += '                    </div>';
            html += '                    <div class="col-xs-3">';
            html += '                        ' + hostObj.recordTimestamp;
            html += '                    </div>';
            html += '                    <div class="col-xs-3"><span class="pull-right glyphicon glyphicon-remove datatable-remove-btn"></span>';
            html += '                        ' + hostObj.executed;
            html += '                    </div>';
            html += '                </div>';
        }
        html += '                </div>';

        c.innerHTML = html;
        let selectSelector = '.datatable-remove-btn';
        let selectNode = $(selectSelector);

        selectNode.on('click', this._onRemoveBtnClick.bind(this));
        $('.datatable-_sort-btn').on('click', this._sortBtnClick.bind(this));

    }

    _onRemoveBtnClick(e) {
        let selectedName = $(e.target).parent('div').parent('div').data('hostobj').hostname;
        this.onRemove(selectedName);
    }

    _sortBtnClick(e){
        let selectedCol = $(e.target).data('columnname');
        this._sort(selectedCol);
    }
}
