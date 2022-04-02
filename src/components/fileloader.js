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

    fileUploaded() {
        var files = Array.from(document.getElementById("projectUpload").files);
        this.setState({
            filesUploaded: files
        }, this.readmultifiles());

    }

    readmultifiles() {
        this.readFile();
    }

    readFile() {
        var reader = new FileReader();
        if (this.state.index >= Array.from(document.getElementById("projectUpload").files)) return;
        var file = Array.from(document.getElementById("projectUpload").files)[this.state.index];
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

    processFile(fileContects) {
        this.readFileHelper(fileContects);
    }

    readFileHelper(currentFile) {
        let index = currentFile.indexOf(this.state.apiPrefix);
        if (index !== -1) {
            let closingIndex = currentFile.indexOf('"', index + 1)
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
                        <input type="file" id="projectUpload" multiple />
                        <button type="button" onClick={this.fileUploaded.bind(this)}>Process</button>
                    </div>
                    <button type="button" onClick={this.loadEndpoints.bind(this)}>See Endpoints</button>
                </form>
            </div>
        );
    }
}

export default FileLoader;
