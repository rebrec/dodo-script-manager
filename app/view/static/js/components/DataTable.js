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
    }

   
    _updateDataSource() {
        return new Promise((resolve, reject) => {
            $.getJSON(this._datasourceURL, data => {
                if (data.status !== 'success')      return reject('Failed to fetch url : ' + JSON.stringify(data));
                if (typeof data.data.length !== 'number')   return reject('Retrieved data is not an Array! (no length property)');

                this._datasourceCache = data.data;
                return resolve();
            });
        })
            .then(this._build.bind(this));
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
            return JSON.parse(elt.executed) == true;
        });
        let html = '';

        html += '<div class="row">';
        html += '    <div class="col-sm-4"><h2>';
        html += '        Executed : ' + executed.length;
        html += '    </h2></div>';
        html += '    <div class="col-sm-4"><h2>';
        html += '        Total Count : ' + this._datasourceCache.length;
        html += '    </h2></div>';
        html += '    <div class="col-sm-3">';
        html += '    </div>';
        html += '    <div class="col-sm-1">';
        html += '        <span style="font-size:1.5rem" class="fa fa-refresh datable-refresh-btn right"></span>';
        html += '    </div>';
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
        html += '   <div class="col-sm-2 datatable-_sort-btn" data-columnname="executed"><b>';
        html += '       ' + 'Executed';
        html += '   </b></div>';
        html += '   <div class="col-sm-1"><b>';
        html += '       ' + 'Actions';
        html += '   </b></div>';
        html += '</div>';
        // Rows
        html += '<div class="table-content accordion" id="accordion">';
        html += '</div>';
        c.innerHTML = html;

        let accordion = $('#accordion');
        for (let i = 0; i < this._datasourceCache.length; i++) {
            let hostObj = this._datasourceCache[i];
            let isTester = this._isTester(hostObj.hostname);
            let cssTester = isTester ? 'beta-tester' : 'not-beta-tester';
            let panelSelector = hostObj.hostname;
            let div = $('<div class="highlightable bottom-line row"></div>').data('hostobj', hostObj);
            
            let divBody = '';
            divBody += '                   <div class="col-sm-3 field-hostname panel">';
            divBody += '                        ' + hostObj.hostname;

            divBody += '                    </div>';
            divBody += '                    <div class="col-sm-3">';
            divBody += '                        ' + hostObj.lastCheckTimestamp;
            divBody += '                    </div>';
            divBody += '                    <div class="col-sm-3">';
            divBody += '                        ' + hostObj.recordTimestamp;
            divBody += '                    </div>';
            divBody += '                    <div class="col-sm-2">';
            divBody += '                        ' + hostObj.executed;
            divBody += '                    </div>';
            divBody += '                    <div class="col-sm-1">';
            divBody += '                       <div class="row">';
            divBody += '                           <div class="col-2 text-center">';

            if (Object.keys(hostObj.additionnalData).length > 0) {
                divBody += '<a data-toggle="collapse" href="#' + panelSelector +'" role="button" class="fa fa-info datatable-additionnaldata-btn" data-parent="#accordion" title="Show Details"></a>';
            }
            divBody += '                           </div>';
            divBody += '                           <div class="col-2 text-center">';

            let testerBtnTitle = isTester ? 'Remove from Testers' : 'Add to Testers';
            divBody += '                                <span class="fa fa-flask datatable-btn-add-tester ' + cssTester + '" title="' + testerBtnTitle + '"></span>';
            divBody += '                           </div>';
            divBody += '                           <div class="col-2 text-center">';
            divBody += '                               <span class="fa fa-remove datatable-remove-btn" title="Remove"></span>';
            divBody += '                           </div>';
            divBody += '                       </div>';

            divBody += '                    </div>';

            divBody += this._buildDetailPanel(panelSelector, hostObj);
            // if (i>4)break;
            div.append(divBody);
            accordion.append(div);
        }

        let selectSelector = '.datatable-remove-btn';
        let selectNode = $(selectSelector);

        // we need to register an handler here because bootstrap don't do it using 'live' ... a bit hackish but works
        $('[data-toggle="collapse"]').click(function(e){
            e.preventDefault();
            var target_element= $(this).attr("href").replace(/\./g, '\\\.');
            $('.collapse').collapse('hide');
            $(target_element).collapse('toggle');
            return false;
        });

        $('.not-beta-tester').on('click', this._onAddTesterClick.bind(this));
        $('.beta-tester').on('click', this._onRemoveTesterClick.bind(this));
        selectNode.on('click', this._onRemoveBtnClick.bind(this));
        $('.datatable-_sort-btn').on('click', this._sortBtnClick.bind(this));
        $('.datable-refresh-btn').on('click', this._updateDataSource.bind(this));

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
            html += '<div class="col-sm-1">';
            html += '</div>';
            html += '<div class="col-sm-3 datatable-additionnaldata-key">';
            html += '   ' + key;
            html += '</div>';
            html += '<div class="col-sm-8 datatable-additionnaldata-value">';
            if (key === 'logs' && value.hasOwnProperty('length')){
                html += '<div class="datatable-additionnaldata-logs">';
                for (let j=0;j<value.length;j++) {
                    html += '   ' + value[j] + '<br/>';
                }
                html += '</div>';
            } else {
                html += '   ' + value;
            }
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
        let selectedCol = $(e.target).parent('div').data('columnname');
        console.log('col : ' + selectedCol);
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
