import Sidebar from "./Sidebar";
import Header from "./Header";
 

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {/* <Sidebar /> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100">
        <Header />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
