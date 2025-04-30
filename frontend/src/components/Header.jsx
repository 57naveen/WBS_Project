import { FaBell, FaSearch } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "../utils/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { addUser, removeUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import userLogo from "../images/user.png";

const Header = () => {
  const dispatch = useDispatch();
  const user = useSelector((store) => store.user);
  const [greeting, setGreeting] = useState("Good morning");
  const [currentDate, setCurrentDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const date = new Date();
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const dayNum = date.getDate();
    const year = date.getFullYear();
    setCurrentDate(`${day}, ${dayNum} ${month} ${year}`);

    const hour = date.getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const handelSignOut = () => {
    signOut(auth)
      .then(() => {})
      .catch(() => navigate("/error"));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const { uid, email, displayName } = user;
        dispatch(addUser({ uid, email, displayName }));
        navigate("/dashboard");
      } else {
        dispatch(removeUser());
        navigate("/dashboard");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
<div className="w-full bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 shadow-lg rounded-b-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  {/* Top: Greeting & Date */}
  <div className="text-white">
    <p className="text-sm font-semibold">
      {greeting},{" "}
      <span className="uppercase text-amber-300">{user?.displayName}</span>
    </p>
    <p className="text-xs text-gray-200">{currentDate}</p>
  </div>

  {/* Middle: Search bar (hidden on mobile) */}
  <div className="hidden sm:flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm">
    <FaSearch className="text-gray-500 text-sm" />
    <input
      type="text"
      placeholder="Search..."
      className="bg-transparent outline-none pl-2 text-gray-700 text-sm w-40"
    />
  </div>

  {/* Bottom (mobile) / Right (desktop): Notification, Avatar, Sign Out */}
  <div className="flex items-center gap-3">
    <div className="relative cursor-pointer">
      <FaBell className="text-white text-lg hover:text-yellow-300 transition" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 py-0.5 rounded-full">
        3
      </span>
    </div>

    <img
      src={userLogo}
      alt="User Icon"
      className="w-8 h-8 rounded-full border-2 border-white shadow"
    />

    <button
      onClick={handelSignOut}
      className="text-xs font-medium text-white bg-gradient-to-r from-red-500 to-orange-400 px-4 py-1.5 rounded-full shadow hover:scale-105 transition"
    >
      Sign Out
    </button>
  </div>
</div>

  );
};

export default Header;
