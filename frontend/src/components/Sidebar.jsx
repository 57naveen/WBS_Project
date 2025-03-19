import { FaTachometerAlt, FaTasks, FaFileAlt, FaChartBar, FaRegAngry } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";

const Sidebar = ({ setShowAdminPanel }) => {
  const { role, loading } = useAuth();

  const handleAdminPage = () => {
    if (loading) return;
    if (role !== "admin") {
      console.log("Access Denied");
      return;
    }
    setShowAdminPanel(true); // ✅ Set state in Dashboard to show AdminPanel
  };

  return (
    <div className="h-screen w-64 bg-gray-900 text-white p-5 flex flex-col">
      <h1 className="text-xl font-bold mb-5">WBS</h1>

      <nav className="space-y-3">
        <a href="#" className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800">
          <FaTachometerAlt className="text-xl" /> <span>Dashboard</span>
        </a>
        <a href="#" className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800">
          <FaTasks className="text-xl" /> <span>My Tasks</span>
        </a>
        <a href="#" className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800">
          <FaFileAlt className="text-xl" /> <span>Docs</span>
        </a>
        <a href="#" className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800">
          <FaChartBar className="text-xl" /> <span>Reporting</span>
        </a>

        {role === "admin" && (
          <button
            onClick={handleAdminPage}
            className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800"
          >
            <FaRegAngry className="text-xl" /> <span>Admin</span>
          </button>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
