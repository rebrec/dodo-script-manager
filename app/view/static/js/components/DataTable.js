class DataTable {
    constructor(container, opt) {
        this._containerSelector = container;
        this.opt = opt || { };
        this._DOMContainer = document.querySelector(this._containerSelector);
        if (!this._DOMContainer) throw ('Fail to retrieve container with selector : "' + this._containerSelector + '".');
        this._datasourceURL = null;
        this._datasourceCache = null;
        this.onRemove = function(){};
        this.onRemoveTesterClick = function(){};
        this.onAddTesterClick = function(){};
        this._sortedKey = 'hostname'
        this._sortAscending = true;
        this._scriptSettings = { testers:[]};
        this._scriptSettings = {
            testers:['PC1706-055']
        }
    }

    setScriptSettings(settings){
        this._scriptSettings = settings;
    }

    _isTester(hostname){
        return this._scriptSettings.testers.indexOf(hostname) > -1;
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
        let executedCount = 0;
        let executed = this._datasourceCache.filter(elt => {
            return elt.executed == true;
        });
        let html = '';

        html += '<div class="row">';
        html += '    <div class="col-sm-6"><h2>';
        html += '        Executed : ' + executed.length;
        html += '    </h2></div>';
        html += '    <div class="col-sm-6"><h2>';
        html += '        Total Count : ' + this._datasourceCache.length;
        html += '    </h2></div>';
        html += '</div>';
        // Header
        html += '<div class="bottom-line row">';
        html += '   <div class="col-sm-3 datatable-_sort-btn" data-columnname="hostname"><b>';
        html += '       ' + 'Hostname';
        html += '   </b></div>';
        html += '   <div class="col-sm-3 datatable-_sort-btn" data-columnname="lastCheckTimestamp"><b>';
        html += '   ' + 'Last Check Time';
        html += '   </b></div>';
        html += '   <div class="col-sm-3 datatable-_sort-btn" data-columnname="recordTimestamp"><b>';
        html += '   ' + 'Execution Time';
        html += '   </b></div>';
        html += '   <div class="col-sm-1 datatable-_sort-btn" data-columnname="executed"><b>';
        html += '       ' + 'Executed';
        html += '   </b></div>';
        html += '   <div class="col-sm-2 datatable-_sort-btn" data-columnname="executed"><b>';
        html += '       ' + 'Actions';
        html += '   </b></div>';
        html += '</div>';
        // Rows
        html += '<div class="table-content accordion" id="accordion">';

        for (let i = 0; i < this._datasourceCache.length; i++) {
            let hostObj = this._datasourceCache[i];
            let isTester = this._isTester(hostObj.hostname);
            let cssTester = isTester ? 'beta-tester' : 'not-beta-tester';
            let panelSelector = hostObj.hostname;
            html += '                <div class="highlightable bottom-line row" data-hostobj=\'' + JSON.stringify(hostObj) + '\'>';
            html += '                   <div class="col-sm-3 field-hostname panel">';
            html += '                        ' + hostObj.hostname;

            html += '                    </div>';
            html += '                    <div class="col-sm-3">';
            html += '                        ' + hostObj.lastCheckTimestamp;
            html += '                    </div>';
            html += '                    <div class="col-sm-3">';
            html += '                        ' + hostObj.recordTimestamp;
            html += '                    </div>';
            html += '                    <div class="col-sm-1">';
            html += '                        ' + hostObj.executed;
            html += '                    </div>';
            html += '                    <div class="col-sm-2">';
            html += '                       <div class="row">';
            html += '                           <div class="col-1 align-middle align-items-center">';

            if (Object.keys(hostObj.additionnalData).length > 0) {
                html += '<a data-toggle="collapse" href="#' + panelSelector +'" role="button" class="fa fa-info datatable-additionnaldata-btn" data-parent="#accordion" title="Show Details"></a>';
            }
            html += '                           </div>';
            html += '                           <div class="col-1 align-middle align-items-center">';

            let testerBtnTitle = isTester ? 'Remove from Testers' : 'Add to Testers';
            html += '                                <span class="fa fa-flask datatable-btn-add-tester ' + cssTester + '" title="' + testerBtnTitle + '"></span>';
            html += '                           </div>';
            html += '                           <div class="col- align-middle align-items-center">';
            html += '                               <span class="fa fa-remove datatable-remove-btn" title="Remove"></span>';
            html += '                           </div>';
            html += '                       </div>';

            html += '                    </div>';
            html += '                </div>';

            html += this._buildDetailPanel(panelSelector, hostObj);
            // if (i>4)break;
        }

        html += '                </div>';

        c.innerHTML = html;
        let selectSelector = '.datatable-remove-btn';
        let selectNode = $(selectSelector);

        // we need to register an handler here because bootstrap don't do it using 'live' ... a bit hackish but works
        $('[data-toggle="collapse"]').click(function(e){
            e.preventDefault();
            var target_element= $(this).attr("href");
            $('.collapse').collapse('hide');
            $(target_element).collapse('toggle');
            return false;
        });

        $('.not-beta-tester').on('click', this._onAddTesterClick.bind(this));
        $('.beta-tester').on('click', this._onRemoveTesterClick.bind(this));
        selectNode.on('click', this._onRemoveBtnClick.bind(this));
        $('.datatable-_sort-btn').on('click', this._sortBtnClick.bind(this));

    }

    _buildDetailPanel(panelSelector, hostObj){
        let additionalData = hostObj.additionnalData || {};
        if (Object.keys(additionalData).length === 0) return '';
        let html = '';

        html += '<div class="panel">'; // parent class needed
        html += '<div class="collapse" id="' + panelSelector + '">';
        html += '   <div class="row datatable-additionaldata-panel" >';

        let keys = Object.keys(additionalData);
        for (let i=0;i<keys.length;i++){
            let key = keys[i];
            let value = additionalData[key];
            html += '<div class="col-sm-3">';
            html += '</div>';            html += '<div class="col-sm-4">';
            html += '   ' + key;
            html += '</div>';
            html += '<div class="col-sm-4">';
            html += '   ' + value;
            html += '</div>';
            // break;
        }

        html += '   </div>';
        html += '</div>';
        html += '</div>';

        return html;
    }
    _onRemoveBtnClick(e) {
        let hostname = $(e.target).parent('div').parent('div').parent('div').parent('div').data('hostobj').hostname;
        this.onRemove(hostname);
    }

    _sortBtnClick(e){
        let selectedCol = $(e.target).data('columnname');
        this._sort(selectedCol);
    }

    _onAddTesterClick(e){
        let hostname = $(e.target).parent('div').parent('div').parent('div').parent('div').data('hostobj').hostname;
        this.onAddTesterClick(hostname);
    }
    _onRemoveTesterClick(e){
        let hostname = $(e.target).parent('div').parent('div').parent('div').parent('div').data('hostobj').hostname;
        this.onRemoveTesterClick(hostname);
    }

}
