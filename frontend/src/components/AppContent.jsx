import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { removeUser, addUser } from "../utils/userSlice";
import { jwtDecode } from "jwt-decode";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/pages/Dashboard";
import Projects from "../components/pages/Projects";
import Tasks from "../components/pages/Task";
import Employees from "../components/pages/Employee";
import Login from "../components/Login";

const AppContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userLogged = useSelector((state) => state.user);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // 🔥 Check token and persist user session
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("firebase_token");
      if (!token) {
        dispatch(removeUser());
        navigate("/");
        return;
      }

      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 < Date.now()) {
          console.warn("Token expired! Logging out...");
          localStorage.removeItem("firebase_token");
          dispatch(removeUser());
          navigate("/");
        } else {
          dispatch(addUser({ token })); // Restore user session
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("firebase_token");
        dispatch(removeUser());
        navigate("/");
      }
    };

    checkToken();
  }, [dispatch, navigate]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
      <div className="flex">
        {userLogged && <Sidebar setShowAdminPanel={setShowAdminPanel} />}
        <div className="flex-1">
          <main className="p-6">
            <Routes>
              <Route path="/" element={userLogged ? <Dashboard /> : <Login />} />
              <Route path="/dashboard" element={userLogged ? <Dashboard showAdminPanel={showAdminPanel} /> : <Login />} />
              <Route path="/projects" element={userLogged ? <Projects /> : <Login />} />
              <Route path="/tasks" element={userLogged ? <Tasks /> : <Login />} />
              <Route path="/employees" element={userLogged ? <Employees /> : <Login />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
};

export default AppContent;
