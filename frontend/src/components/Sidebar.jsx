import { FaTachometerAlt, FaTasks, FaFileAlt, FaChartBar } from "react-icons/fa";

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-gray-900 text-white p-5 flex flex-col">
      {/* Brand Logo */}
      <h1 className="text-xl font-bold mb-5">WBS</h1>

      {/* Navigation */}
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
      </nav>

      {/* Upgrade Button */}
      {/* <div className="mt-auto">
        <button className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">
          Upgrade to Pro 🚀
        </button>
      </div> */}
    </div>
  );
};

export default Sidebar;
