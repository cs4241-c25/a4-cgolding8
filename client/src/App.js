import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ToDo from "./pages/ToDo.js";
import Login from "./pages/Login.js";

function App() {
  return (
		<>
			<BrowserRouter>
				<Routes>
					<Route index element={<Login/>}></Route>
					<Route path="/login" element={<Login/>}></Route>
					<Route path="/todo" element={<ToDo/>}></Route>
				</Routes>
			</BrowserRouter>
		</>
  );
}

export default App;
