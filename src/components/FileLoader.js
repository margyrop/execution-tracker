import React from "react";
import './FileLoader.css';
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
            endpointComp: "",
            index: 0,
            uploadType: "",
            processUIDisabled: false,
            processBackendDisabled: false,
            methodEndpointMap: []
        };
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

    readFile() {
        var reader = new FileReader();
        if (this.state.index >= (this.state.uploadType === UI ? this.state.filesUploadedUI.length : this.state.filesUploadedBackend.length)) {
            this.setState({index: 0});
            return;
        }
        var file = this.state.uploadType === UI ? this.state.filesUploadedUI[this.state.index] : this.state.filesUploadedBackend[this.state.index];
        reader.onload = this.fileLoad.bind(this);
        reader.readAsText(file);
    }

    fileLoad(e) {
        // get file content  
        if(this.state.uploadType === UI) 
            this.readFileHelperUI(e.target.result);
        else 
            this.readFileHelperBackend(e.target.result);
        // do sth with bin
        this.setState({
            index: this.state.index + 1
        });
        this.readFile();
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
                this.state.methodEndpointMap.push({endpoint: endpoint, method: methodName});
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
        this.state.methodEndpointMap.forEach(endpoint => {
            items.push(<li>{`Endpoint: ${endpoint.endpoint} | Method: ${endpoint.method}`}</li>)
        });
        this.setState({
            endpointComp: items
        });
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <ul id="endpoints">
                        {this.state.endpointComp}
                    </ul>
                    <div className="row">
                        <label>
                            API Prefix
                        </label>
                    </div>
                    <div className="row">
                        <input className="api-prefix" type="text" id="apiPrefix" onChange={this.apiPrefixChanged.bind(this)} />
                    </div>
                    <div className="row">
                        <label>Upload UI Files</label>
                    </div>
                    <div className="row">
                        <div class="file-field input-field">
                            <div class="btn browse">
                                <span>Browse</span>
                                <input className="browse-input" type="file" id="projectUploadUI" directory="" webkitdirectory="" onChange={this.addFilesUI.bind(this)} />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <button disabled={this.state.processUIDisabled} className="btn" type="button" onClick={this.readFileUI.bind(this)}>Process</button>
                    </div>
                    <div className="row">
                        <label>Upload Backend Files</label>
                    </div>
                    <div className="row">
                        <div class="file-field input-field">
                            <div class="btn browse">
                                <span>Browse</span>
                                <input className="browse-input" type="file" id="projectUploadBackend" directory="" webkitdirectory="" onChange={this.addFilesBackend.bind(this)} />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <button disabled={this.state.processBackendDisabled} className="btn" type="button" onClick={this.readFileBackend.bind(this)}>Process</button>
                    </div>
                    <div className="row">
                        <div className="loading-bar-container" style={{display: this.state.processBackendDisabled ? 'block' : 'none'}}>
                            <div className="loading-bar" style={{width: this.state.index !== 0 ? `${(this.state.index / this.state.filesUploadedBackend.length) * 400}px` : '400px'}}></div>
                        </div>
                    </div>
                    <button className="btn" type="button" onClick={this.loadMap.bind(this)}>See Executions</button>
                </form>
            </div>
        );
    }
}

export default FileLoader;
