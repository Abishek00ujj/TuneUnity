import {BrowserRouter,Routes,Route} from 'react-router-dom';
import Home from "./pages/Home";
import Player from './components/Player';
import Login from './pages/Login';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login/>}/>
          <Route path="/home" element={<Home/>}/>
          {/* Add the :roomId parameter to the /player route */}
          <Route path="/player/:roomId" element={<Player/>}/>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;