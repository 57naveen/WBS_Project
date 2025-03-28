import { FaBell, FaSearch } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
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
    // Get current date
    const date = new Date();
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const dayNum = date.getDate();
    const year = date.getFullYear();

    setCurrentDate(`${day}, ${dayNum} ${month} ${year}`);

    // Set dynamic greeting
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
      .catch((error) => {
        navigate("/error");
      });
  };

  // Using the useEffect to call this APi at initial render
  useEffect(() => {
    //This function  return the user object
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        //sign In

        // getting this object from firebase
        const { uid, email, displayName } = user;

        //inserting the user object into our slice using dispatch function
        dispatch(addUser({ uid: uid, email: email, displayName: displayName }));
        navigate("/dashboard");
      } else {
        //sign out

        // when user signed out remove the user data from the slice
        dispatch(removeUser());
        navigate("/dashboard");
      }
    });

    // unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-500 p-4 shadow-lg rounded-b-2xl">
      {/* Greeting & Date */}
      <div>
        <h1 className="text-xl font-bold text-white">
          {greeting},{" "}
          <span className="uppercase text-amber-300">{user?.displayName} </span>
        </h1>
        <p className="text-gray-200">{currentDate}</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center ml-40 bg-white px-4 py-2 rounded-full shadow-sm">
        <FaSearch className="text-gray-500" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none pl-2 text-gray-700"
        />
      </div>
      <div className="ml-auto flex items-center gap-4 mx-2">
        {user ? (
          <div className="flex items-center gap-4">
            <img
              className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
              alt="User Icon"
              src={userLogo}
            />
            <button
              onClick={handelSignOut}
              className="px-5 py-2 font-medium text-white bg-gradient-to-r from-red-500 to-orange-400 rounded-full shadow-md hover:scale-105 transition-all duration-300"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button className="px-6 py-2 font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full shadow-md hover:scale-105 transition-all duration-300">
            Sign In
          </button>
        )}
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center space-x-4">
        <div className="relative cursor-pointer">
          <FaBell className="text-2xl text-white hover:text-yellow-300 transition duration-300" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            3
          </span>
        </div>
        {/* <img
          src="https://via.placeholder.com/40" // Replace with real user image
          alt="User Avatar"
          className="w-10 h-10 rounded-full border-2 border-white cursor-pointer"
        /> */}
      </div>
    </div>
  );
};

export default Header;
