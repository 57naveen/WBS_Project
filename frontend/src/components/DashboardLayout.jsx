// import Sidebar from "./Sidebar";
import Header from "./Header";
 
const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {/* <Sidebar /> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Sticky Header */}
        <Header />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;