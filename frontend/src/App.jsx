import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import appStore from "./utils/appStore";
import AppContent from "./components/AppContent";



const App = () => {
  return (
    <Provider store={appStore}>
      <Router>
       <AppContent />
      </Router>
    </Provider>
  );
};

export default App;
