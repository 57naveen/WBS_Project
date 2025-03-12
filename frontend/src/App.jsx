import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Dashboard from "./components/pages/Dashboard";
import Projects from "./components/pages/Projects";
import Tasks from "./components/pages/Task";
import Employees from "./components/pages/Employee";
// import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Dashboard from "./components/pages/Dashboard";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex">
        {/* <div className="h-screen" > */}
         <Sidebar />
        {/* </div> */}
        
        <div className="flex-1">
          {/* <Navbar /> */}
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/employees" element={<Employees />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
