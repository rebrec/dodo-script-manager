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
        this._columns = [
            { title: 'Hostname', property: 'hostname' },
            { title: 'Last Check Time', property: 'lastCheckTimestamp' },
            { title: 'Execution Time', property: 'recordTimestamp' },
            { title: 'IP Address', property: 'ipaddresses' },
            { title: 'Username', property: 'username' },
            { title: 'Executed', property: 'executed' }
        ];
        this._patchedColumns = ['ipaddresses', 'username']; // columns that will be copied frop additionnalData, to parent object
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

    _patchDatasourceCache() { // used temporarily to place additionnaldata.ipaddresses within hostobj (one level up)
                               // because every column need to be withing hostobj and not hostobj.additionnalData.something
        for (let i=0;i<this._datasourceCache.length;i++){
            let obj = this._datasourceCache[i];
            for (let j=0;j<this._patchedColumns.length;j++){
                let patchedColumn = this._patchedColumns[j];
                obj[patchedColumn] = '';
                if (obj.additionnalData && obj.additionnalData[patchedColumn]) obj[patchedColumn] = obj.additionnalData[patchedColumn];
            }

        }
    }

    _build() {
        this._patchDatasourceCache(); // used temporarily to place additionnaldata.ipaddresses within hostobj (one level up)
                        // because every column need to be withing hostobj and not hostobj.additionnalData.something
        this._sortDatasourceCache();
        let c = this._DOMContainer;
        let executedCount = 0;
        let executed = this._datasourceCache.filter(elt => {
            return JSON.parse(elt.executed) == true;
        });
        let html = '';

        html += '<div class="row">';
        html += '    <div class="col-sm-3"><h2>';
        html += '        Executed : ' + executed.length;
        html += '    </h2></div>';
        html += '    <div class="col-sm-3"><h2>';
        html += '        Testers : ' + this._scriptSettings.testers.length
        html += '    </h2></div>';
        html += '    </div>';
        html += '    <div class="col-sm-3"><h2>';
        html += '        Total : ' + this._datasourceCache.length;
        html += '    </h2></div>';
        html += '    <div class="col-sm-2">';
        html += '    </div>';
        html += '    <div class="col-sm-1">';
        html += '        <span style="font-size:1.5rem" class="fa fa-refresh datable-refresh-btn right"></span>';
        html += '    </div>';
        html += '</div>';
        // Header
        html += '<table class="col-12">';
        html += '   <thead>';
        html += '      <tr>';
        for (let i=0;i < this._columns.length;i++){
            let column = this._columns[i];
            html += '         <td class="datatable-_sort-btn" data-columnname="' + column.property + '"><b>';
            html += '       ' + column.title;
            html += '         </b></td>';
        }
        html += '         <td><b>';
        html += '       ' + 'Actions';
        html += '         </b></td>';
        html += '      </tr>';
        html += '   </thead>';

        html += '   <tbody id="accordion">';
        html += '   </tbody>';
        html += '</table>';

        // Rows
        c.innerHTML = html;

        let accordion = $('#accordion');
        for (let i = 0; i < this._datasourceCache.length; i++) {
            let hostObj = this._datasourceCache[i];
            let isTester = this._isTester(hostObj.hostname);
            let cssTester = isTester ? 'beta-tester' : 'not-beta-tester';
            let panelSelector = hostObj.hostname;
            let deploymentStateClass = '';
            if (JSON.parse(hostObj.executed) == true) deploymentStateClass = 'table-success';
            if (isTester && JSON.parse(hostObj.executed) == false) deploymentStateClass = 'table-warning';
            let tr = $('<tr class="highlightable bottom-line ' + deploymentStateClass + '"></tr>').data('hostobj', hostObj);
            let trBody = '';
            for (let j=0;j < this._columns.length;j++){
                let column = this._columns[j];
                trBody  += '         <td>';
                trBody  += '       ' + hostObj[column.property];
                trBody  += '         </td>';
            }
            trBody += '                    <td class="">';
            trBody += '                       <table>';
            trBody += '                           <tr>';
            trBody += '                              <td>';

            if (Object.keys(hostObj.additionnalData).length > 0) {
                trBody += '<a data-toggle="collapse" href="#' + panelSelector +'" role="button" class="fa fa-info datatable-additionnaldata-btn" data-parent="#accordion" title="Show Details"></a>';
            }
            trBody += '                              </td>';
            trBody += '                              <td>';

            let testerBtnTitle = isTester ? 'Remove from Testers' : 'Add to Testers';

            trBody += '                              <td>';
            trBody += '                                <span class="fa fa-flask datatable-btn-add-tester ' + cssTester + '" title="' + testerBtnTitle + '"></span>';
            trBody += '                              </td>';
            trBody += '                              <td>';
            trBody += '                               <span class="fa fa-remove datatable-remove-btn" title="Remove"></span>';
            trBody += '                              </td>';
            trBody += '                           </tr>';
            trBody += '                       </table>';
            trBody += '                    </td>';
            tr.append(trBody);
            accordion.append(tr);
            accordion.append(this._buildDetailPanel(panelSelector, hostObj));
            // if (i>4)break;
        }

        html += '   </tbody>';
        html += '</table>';

        let selectSelector = '.datatable-remove-btn';
        let selectNode = $(selectSelector);

        // we need to register an handler here because bootstrap don't do it using 'live' ... a bit hackish but works
        $('[data-toggle="collapse"]').click(function(e){
            e.preventDefault();
            var target_element = $(this).attr("href").replace(/\./g, '\\\.');
            let showed = $('.collapse-show');

            showed.hide()
            let target = $(target_element);
            if (!target.hasClass('collapse-show')) {
                target.show().addClass('collapse-show');
            }
            showed.removeClass('collapse-show');


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

        html += '<tr class="panel">'; // parent class needed
        html += '  <td  colspan="42" class="collapse" id="' + panelSelector + '">';
        html += '    <div class="row datatable-additionaldata-panel" >';

        let keys = Object.keys(additionalData);
        for (let i=0;i<keys.length;i++){
            let key = keys[i];
            let value = additionalData[key];
            html += '<div class="col-sm-1"></div>';
            html += '<div class="col-sm-3 datatable-additionnaldata-key">' + key + '</div>';
            html += '<div class="col-sm-8 datatable-additionnaldata-value">';

            if ((key === 'logs') && value.hasOwnProperty('length')){
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
        html += '  </td>';
        html += '</tr>';
        return html;
    }
    _onRemoveBtnClick(e) {
        let hostname = $(e.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).data('hostobj').hostname;
        this.onRemove(hostname);
    }

    _sortBtnClick(e){
        let selectedCol = $(e.target.parentNode).data('columnname');
        console.log('col : ' + selectedCol);
        this._sort(selectedCol);
    }

    _onAddTesterClick(e){
        let hostname = $(e.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).data('hostobj').hostname;
        this.onAddTesterClick(hostname);
    }
    _onRemoveTesterClick(e){
        let hostname = $(e.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).data('hostobj').hostname;
        this.onRemoveTesterClick(hostname);
    }

}
