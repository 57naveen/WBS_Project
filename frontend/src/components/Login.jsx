import React, { useRef, useState } from "react";
import { checkValidateData } from "../utils/validate";
import { useDispatch } from "react-redux";
import { auth, db } from "../utils/firebase";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const Login = () => {
  const [isSignInForm, setIsSignInForm] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();
  const email = useRef(null);
  const name = useRef(null);
  const password = useRef(null);
  const dispatch = useDispatch();

  const handleButtonClick = async () => {
    // Validate input fields
    const message = checkValidateData(email.current.value, password.current.value);
    setErrorMessage(message);
    if (message) return;

    if (!isSignInForm) {
      // Store name in a variable BEFORE async operations
      const userName = name.current?.value?.trim();
      if (!userName) {
        console.error("Name input is missing.");
        setErrorMessage("Please enter your full name.");
        return;
      }

      try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.current.value,
          password.current.value
        );
        const user = userCredential.user;
        console.log("User created:", user.uid);

        // Store user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: "user", // Default role
          createdAt: new Date(),
        });
        console.log("Firestore document created for user:", user.uid);

        // Get the Firebase auth token
      const token = await user.getIdToken();
      localStorage.setItem("firebase_token", token); // Store token for API requests

        // Delay profile update slightly
        setTimeout(async () => {
          await updateProfile(user, {
            displayName: userName,
            photoURL: "https://example.com/jane-q-user/profile.jpg",
          });

          // Reload Firebase user to get updated displayName
          await auth.currentUser.reload();
          const updatedUser = auth.currentUser;

          console.log("Profile updated successfully:", updatedUser.displayName);

          // Update Redux store
          dispatch(
            addUser({
              uid: updatedUser.uid,
              email: updatedUser.email,
              displayName: updatedUser.displayName || userName, // Fallback
            })
          );

          // Navigate to dashboard
          navigate("/dashboard");
        }, 500);
      } catch (error) {
        console.error("Signup failed:", error.message);
        setErrorMessage(error.message);
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.current.value, password.current.value);
        const user = userCredential.user;
        console.log("User signed in:", user);
  
        // Get the Firebase auth token
        const token = await user.getIdToken();
        localStorage.setItem("firebase_token", token); // Store token for API requests
  
        navigate("/dashboard");
      } catch (error) {
        console.error("Sign-in failed:", error.message);
        setErrorMessage(error.message);
      };
    }
  };

  return (
    <div className="bg-black w-3/12 absolute p-12 my-36 mx-auto right-0 left-0 text-white rounded-lg opacity-85">
      <form onSubmit={(e) => e.preventDefault()}>
        <h1 className="font-bold text-3xl py-4">{isSignInForm ? "Sign In" : "Sign Up"}</h1>

        {!isSignInForm && (
          <input
            ref={name}
            type="text"
            placeholder="Full name"
            className="p-2 my-2 bg-gray-600 w-full rounded-sm"
          />
        )}
        <input
          ref={email}
          type="text"
          placeholder="Email Address"
          className="p-2 my-2 bg-gray-600 w-full rounded-sm"
        />
        <input
          ref={password}
          type="password"
          placeholder="Password"
          className="p-2 my-2 bg-gray-600 w-full rounded-sm"
        />
        <p className="text-red-500 font-bold text-lg py-2">{errorMessage}</p>

        <button
          className="p-2 my-4 rounded-sm bg-red-500 font-bold w-full cursor-pointer"
          onClick={handleButtonClick}
        >
          {isSignInForm ? "Sign In" : "Sign Up"}
        </button>

        <div className="flex items-center justify-center">
          <a>Forgot password?</a>
        </div>

        <div className="my-4">
          <span>
            {isSignInForm ? "New User? " : "Already a user? "}
            <a className="font-bold cursor-pointer" onClick={() => setIsSignInForm(!isSignInForm)}>
              {isSignInForm ? "Sign up now." : "Sign In"}
            </a>
          </span>
        </div>
      </form>
    </div>
  );
};

export default Login;
