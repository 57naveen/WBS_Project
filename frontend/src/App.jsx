import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Dashboard from "./components/pages/Dashboard";
import Projects from "./components/pages/Projects";
import Tasks from "./components/pages/Task";
import Employees from "./components/pages/Employee";
// import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Dashboard from "./components/pages/Dashboard";

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
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
