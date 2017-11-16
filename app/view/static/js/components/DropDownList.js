class DropDownList {
    constructor(container, opt) {
        this._containerSelector = container;
        this.opt = Object.assign({
                sort: true,
                emptyArrayValue: "Empty"
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
                if (typeof data.data.length !== 'number')   return reject('Retrieved data is not an Array! (no length property)');
                if (data.data.length === 0) data.data.push(this.opt.emptyArrayValue);
                this._datasourceCache = data.data;
                return resolve();
            });
        });
    }

    _build() {
        let c = this._DOMContainer;
        let html = '';

        html += '<div class="form-group row">';
        html += '    <select class="form-control col-12-sp">';
        // sort the array with eventual custom function
        if (this.opt.sort) {
            if (this.sortFunction) this._datasourceCache.sort(this.sortFunction);
            else  this._datasourceCache.sort();
        }

        for (let i = 0; i < this._datasourceCache.length; i++) {
            let name = this._datasourceCache[i];
            html += '                <option>';
            html += '            ' + name
            html += '                </option>';
        }

        html += '    </select>';
        html += '</div>';
        c.innerHTML = html;
        let selectSelector = this._containerSelector + ' select';
        let selectNode = $(selectSelector);
        selectNode.on('change', this._onSelectChange.bind(this));
        let fakeEvent = { target: selectNode };
        this._onSelectChange(fakeEvent);
    }

    _onSelectChange(e) {
        let selectedName = $(e.target).val();
        this.onChange(selectedName);
    }
}
