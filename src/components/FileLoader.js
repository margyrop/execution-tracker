import React from "react";

class FileLoader extends React.Component {
    constructor(props) {
        super();
        this.state = {
            filesUploaded: props.filesUploaded,
            apiPrefix: "",
            currentFile: "",
            endpoints: [],
            endpointComp: "",
            index: 0
        };
    }

    addFiles(e){
        e.stopPropagation();
        e.preventDefault();

        var fileList = [];

        // if directory support is available
        if(e.dataTransfer && e.dataTransfer.items)
        {
            var items = e.dataTransfer.items;
            for (var i=0; i<items.length; i++) {
                var item = items[i].webkitGetAsEntry();

                if (item) {
                  this.addDirectory(item, fileList);
                }
            }
            this.setState({
                filesUploaded: fileList
            });
            return;
        }

        // Fallback
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length)
        {
            alert('File type not accepted');
            return;
        }

        this.setState({
            filesUploaded: files
        });
    }

    addDirectory(item, files) {
        var _this = this;
        if (item.isDirectory) {
            var directoryReader = item.createReader();
            directoryReader.readEntries(function(entries) {
            entries.forEach(function(entry) {
                    _this.addDirectory(entry, files);
                });
            });
        } else {
            item.file(function(file){
                files.push(file);
            });
        }
    }

    readFile() {
        var reader = new FileReader();
        if (this.state.index >= this.state.filesUploaded.length) return;
        var file = this.state.filesUploaded[this.state.index];
        reader.onload = this.fileLoad.bind(this);
        reader.readAsText(file);
    }

    fileLoad(e) {
        // get file content  
        this.readFileHelper(e.target.result);
        // do sth with bin
        this.setState({
            index: this.state.index + 1
        });
        this.readFile();
    }

    readFileHelper(currentFile) {
        let index = currentFile.indexOf(this.state.apiPrefix);
        if (index !== -1) {
            let closingIndex = currentFile.indexOf('"', index + 1)
            if (closingIndex === -1) {
                closingIndex = currentFile.indexOf("'", index + 1)
            }
            if (closingIndex === -1) {
                closingIndex = currentFile.indexOf("`", index + 1)
            }
            let endpoint = currentFile.substring(index + 1, closingIndex);
            console.log(endpoint);
            this.state.endpoints.push(endpoint)
            this.readFileHelper(currentFile.substring(closingIndex + 1));
        }
    }


    apiPrefixChanged(e) {
        this.setState({
            apiPrefix: `"${e.target.value}`
        });
    }

    loadEndpoints() {
        let items = [];
        this.state.endpoints.forEach(endpoint => {
            items.push(<li>{endpoint}</li>)
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
                        <input type="text" id="apiPrefix" onChange={this.apiPrefixChanged.bind(this)} />
                    </div>
                    <div className="row">
                        <label>
                            Upload Project
                        </label>
                    </div>
                    <div className="row">
                        <input type="file" id="projectUpload" directory="" webkitdirectory="" onChange={this.addFiles.bind(this)}/>
                        <button type="button" onClick={this.readFile.bind(this)}>Process</button>
                    </div>
                    <button type="button" onClick={this.loadEndpoints.bind(this)}>See Endpoints</button>
                </form>
            </div>
        );
    }
}

export default FileLoader;
