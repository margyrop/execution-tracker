import React from "react";
import './FileLoader.css';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

const UI = "UI";
const BACKEND = "BACKEND";

class FileLoader extends React.Component {
    constructor(props) {
        super();
        this.state = {
            filesUploadedUI: [],
            filesUploadedBackend: [],
            apiPrefix: "",
            currentFile: "",
            endpoints: [],
            daoMethodNames: [],
            spConstantNames: [],
            endpointComp: "",
            index: 0,
            uploadType: "",
            processUIDisabled: false,
            processBackendDisabled: false,
            methodEndpointMap: [],
            daoIndex: 0,
            spIndex: 0,
            daoMethodName: "",
            spConstantName: '',
            columnDefs: this.getColDefs(),
            loadingSp: false,
        };
    }

    getColDefs() {
        return [
            // uses the default column properties
            {headerName: 'Endpoint', field: 'endpoint', resizable: true, width: 400},
            // overrides the default with a number filter
            {headerName: 'DAO Method Name', field: 'daoMethod', resizable: true, width: 400},
            // overrides the default using a column type
            {headerName: 'SP Name', field: 'spName', resizable: true, width: 400}
        ];
    }

    addFilesUI(e) {
        this.setState({
            uploadType: UI
        }, () => this.addFiles(e));
    }

    addFilesBackend(e) {
        this.setState({
            uploadType: BACKEND
        }, () => this.addFiles(e));
    }

    addFiles(e) {
        e.stopPropagation();
        e.preventDefault();

        var fileList = [];

        // if directory support is available
        if (e.dataTransfer && e.dataTransfer.items) {
            var items = e.dataTransfer.items;
            for (var i = 0; i < items.length; i++) {
                var item = items[i].webkitGetAsEntry();

                if (item) {
                    this.addDirectory(item, fileList);
                }
            }
            this.state.uploadType === UI ?
                this.setState({
                    filesUploadedUI: fileList
                })
                :
                this.setState({
                    filesUploadedBackend: fileList
                });
            return;
        }

        // Fallback
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            alert('File type not accepted');
            return;
        }

        this.state.uploadType === UI ?
            this.setState({
                filesUploadedUI: files
            })
            :
            this.setState({
                filesUploadedBackend: files
            });
    }

    addDirectory(item, files) {
        var _this = this;
        if (item.isDirectory) {
            var directoryReader = item.createReader();
            directoryReader.readEntries(function (entries) {
                entries.forEach(function (entry) {
                    _this.addDirectory(entry, files);
                });
            });
        } else {
            item.file(function (file) {
                files.push(file);
            });
        }
    }

    readFileUI() {
        this.setState({
            processUIDisabled: true
        });
        this.readFile();
    }

    readFileBackend() {
        this.setState({
            processBackendDisabled: true
        });
        this.readFile();
    }

    readFile(findDao, findSp) {
        var reader = new FileReader();
        if (findDao) {
            if (this.state.daoIndex >= (this.state.uploadType === UI ? this.state.filesUploadedUI.length : this.state.filesUploadedBackend.length)) {
                this.setState({
                    daoIndex: 0
                }, () => this.readFile(false, true));
                return;
            }
            var file = this.state.filesUploadedBackend[this.state.daoIndex];
            reader.onload = this.fileLoadDao.bind(this);
            reader.readAsText(file);
        } else if (findSp) {
            this.setState({loadingSp: true});
            if (this.state.spIndex >= (this.state.uploadType === UI ? this.state.filesUploadedUI.length : this.state.filesUploadedBackend.length)) {
                this.setState({
                    spIndex: 0
                });
                return;
            }
            var file = this.state.filesUploadedBackend[this.state.spIndex];
            reader.onload = this.fileLoadSp.bind(this);
            reader.readAsText(file);

        } else {
            if (this.state.index >= (this.state.uploadType === UI ? this.state.filesUploadedUI.length : this.state.filesUploadedBackend.length)) {
                if (this.state.uploadType === BACKEND) {
                    this.setState({
                        index: 0
                    }, () => this.readFile(true, false));
                } else {
                    this.setState({
                        index: 0
                    });
                }
                return;
            }
            var file = this.state.uploadType === UI ? this.state.filesUploadedUI[this.state.index] : this.state.filesUploadedBackend[this.state.index];
            reader.onload = this.fileLoad.bind(this);
            reader.readAsText(file);
        }

    }

    fileLoadSp(e) {
        this.readFileHelperBackendSp(e.target.result);
        // do sth with bin
        this.setState({
            spIndex: this.state.spIndex + 1
        }, () => this.readFile(false, true));
    }

    fileLoadDao(e) {
        this.readFileHelperBackendDao(e.target.result);
        // do sth with bin
        this.setState({
            daoIndex: this.state.daoIndex + 1
        }, () => this.readFile(true, false));
    }

    fileLoad(e) {
        // get file content  
        if (this.state.uploadType === UI)
            this.readFileHelperUI(e.target.result);
        else
            this.readFileHelperBackend(e.target.result);
        // do sth with bin
        this.setState({
            index: this.state.index + 1
        }, () => this.readFile());

    }

    readFileHelperBackend(currentFile) {
        let index = -1;
        let methodName = "";
        let methodIndex = -1;
        let methodEndIndex = -1;
        this.state.endpoints.forEach(endpoint => {
            index = currentFile.indexOf(endpoint);
            if (index !== -1) {
                methodIndex = currentFile.indexOf(' ', currentFile.indexOf('public ', index) + 8) + 1;
                methodEndIndex = currentFile.indexOf('(', methodIndex + 1);
                methodName = currentFile.substring(methodIndex, methodEndIndex);
                let daoIndex = currentFile.indexOf("DAO", methodEndIndex);
                if (daoIndex !== -1) {
                    let daoMethodName = currentFile.substring(currentFile.indexOf('.', daoIndex) + 1, currentFile.indexOf('(', daoIndex));
                    this.state.methodEndpointMap.push({
                        endpoint: endpoint,
                        method: methodName,
                        daoMethod: daoMethodName
                    });
                    this.state.daoMethodNames.push(daoMethodName);
                }
            }
        });
    }

    readFileHelperBackendDao(currentFile) {
        let index = -1;

        this.state.daoMethodNames.forEach(daoMethodName => {
            index = currentFile.indexOf(` ${daoMethodName}`);
            if (index !== -1) {
                let spConstIndex = currentFile.indexOf('SP_', index);
                if (spConstIndex !== -1) {
                    let constName = currentFile.substring(spConstIndex, this.regexIndexOf(currentFile, /[^a-zA-Z\d\s:_]/, spConstIndex));
                    this.state.methodEndpointMap.find((o) => o.daoMethod === daoMethodName).spConstant = constName;
                    this.state.spConstantNames.push(constName);
                }
            }
        });

    }

    readFileHelperBackendSp(currentFile) {
        let index = -1;
        this.state.spConstantNames.forEach(spConstantName => {
            index = currentFile.indexOf(spConstantName);
            if (index !== -1) {
                let spNameIndex = currentFile.indexOf('"', index);
                if (spNameIndex !== -1) {
                    let spName = currentFile.substring(spNameIndex + 1, currentFile.indexOf('"', spNameIndex + 1));
                    if (this.state.methodEndpointMap.find((o) => o.spConstant === spConstantName)) {
                        this.state.methodEndpointMap.find((o) => o.spConstant === spConstantName).spName = spName;
                    }
                }
            }
        });

    }

    readFileHelperUI(currentFile) {
        let index = currentFile.indexOf(this.state.apiPrefix);
        let closingIndex = index + this.state.apiPrefix.length;
        if (index !== -1) {
            switch (currentFile[index - 1]) {
                case '"':
                    closingIndex = currentFile.indexOf('"', index + 1);
                    break;
                case "'":
                    closingIndex = currentFile.indexOf("'", index + 1);
                    break;
                case "`":
                    closingIndex = currentFile.indexOf("`", index + 1);
                    break;
            }
            if (closingIndex !== index + this.state.apiPrefix.length) {
                let endpoint = currentFile.substring(index + 1, closingIndex);
                endpoint = endpoint.substring(this.state.apiPrefix.length - 1);
                console.log(endpoint);
                if (!this.state.endpoints.includes(endpoint)) {
                    this.state.endpoints.push(endpoint);
                }
            }
            this.readFileHelperUI(currentFile.substring(closingIndex + 1));
        }
    }


    apiPrefixChanged(e) {
        this.setState({
            apiPrefix: `${e.target.value}`
        });
    }

    loadMap() {
        let items = [];
        var map = this.state.methodEndpointMap;
        var map2 = map.filter((e) => e.spName);
        map2 = map2.concat({});
        this.setState({
            endpointComp: items,
            successMsg: `Successfully found ${map2.length} complete execution paths for ${map.length} endpoints on the ${this.state.apiPrefix} API.`,
            methodEndpointMap: map2
        });
    }

    regexIndexOf(text, re, i) {
        var indexInSuffix = text.slice(i).search(re);
        return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i;
    }

    render() {
        return (
            <div>
                <h3 className="row" style={{display: this.state.successMsg ? 'block' : 'none'}}>
                    {this.state.successMsg}
                </h3>
                <div className="row ag-theme-alpine" style={{margin: 'auto', height: 400, width: 1200}}>
                    <AgGridReact
                        rowData={this.state.methodEndpointMap}
                        columnDefs={this.state.columnDefs}
                    >
                    </AgGridReact>
                </div>
                <form>

                    <div className="row">
                        <label>
                            API Prefix
                        </label>
                    </div>
                    <div className="row">
                        <input className="api-prefix" type="text" id="apiPrefix"
                               onChange={this.apiPrefixChanged.bind(this)}/>
                    </div>
                    <div className="row">
                        <label>Upload UI Files</label>
                    </div>
                    <div className="row">
                        <div class="file-field input-field">
                            <div class="btn browse">
                                <span>Browse</span>
                                <input className="browse-input" type="file" id="projectUploadUI" directory=""
                                       webkitdirectory="" onChange={this.addFilesUI.bind(this)}/>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <button disabled={this.state.processUIDisabled} className="btn" type="button"
                                onClick={this.readFileUI.bind(this)}>Process
                        </button>
                    </div>
                    <div className="row">
                        <label>Upload Backend Files</label>
                    </div>
                    <div className="row">
                        <div class="file-field input-field">
                            <div class="btn browse">
                                <span>Browse</span>
                                <input className="browse-input" type="file" id="projectUploadBackend" directory=""
                                       webkitdirectory="" onChange={this.addFilesBackend.bind(this)}/>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <button disabled={this.state.processBackendDisabled} className="btn" type="button"
                                onClick={this.readFileBackend.bind(this)}>Process
                        </button>
                    </div>
                    <div className="row">
                        <div className="loading-bar-container"
                             style={{display: this.state.processBackendDisabled ? 'block' : 'none'}}>
                            <div className="loading-bar"
                                 style={{width: `${(((this.state.spIndex === 0 && this.state.loadingSp) ? this.state.filesUploadedBackend.length : this.state.spIndex) / (this.state.filesUploadedBackend.length)) * 400}px`}}></div>
                        </div>
                    </div>
                    <button className="btn" type="button" onClick={this.loadMap.bind(this)}>See Executions</button>
                </form>
            </div>
        );
    }
}

export default FileLoader;
