import FileLoader from "./components/fileloader";
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Execution Tracker</h1>
        <FileLoader></FileLoader>
      </header>
    </div>
  );
}

export default App;
