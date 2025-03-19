import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Dashboard from "./components/pages/Dashboard";
import Projects from "./components/pages/Projects";
import Tasks from "./components/pages/Task";
import Employees from "./components/pages/Employee";
// import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import { useState } from "react";
import Dashboard from "./components/pages/Dashboard";
import appStore from "./utils/appStore";
import Login from "./components/Login";


function App() {
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  return (
    <Provider store={appStore}>
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        
      />
      <div className="flex">
        {/* <div className="h-screen" > */}
        <Sidebar setShowAdminPanel={setShowAdminPanel} />
        {/* </div> */}

        <div className="flex-1">
          {/* <Navbar /> */}
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard showAdminPanel={showAdminPanel} />} />
              <Route path="/dashboard" element={<Dashboard showAdminPanel={showAdminPanel} />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/employees" element={<Employees />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  </Provider>
  );
}

export default App;
