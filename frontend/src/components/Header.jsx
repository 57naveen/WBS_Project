import { FaBell, FaSearch } from "react-icons/fa";

const Header = () => {
  return (
    <div className="flex justify-between items-center bg-white p-4 shadow-md">
      {/* Greeting & Date */}
      <div>
        <h1 className="text-xl font-bold">Good morning, User! ☀️</h1>
        <p className="text-gray-500">It's Saturday, 22 June 2024</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md">
        <FaSearch className="text-gray-500" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none pl-2"
        />
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center space-x-4">
        <FaBell className="text-xl text-gray-600 cursor-pointer" />
        <img
          src="https://via.placeholder.com/40" // Replace with real user image
          alt="User Avatar"
          className="w-10 h-10 rounded-full"
        />
      </div>
    </div>
  );
};

export default Header;
