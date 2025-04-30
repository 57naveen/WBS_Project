import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import {
  FaTachometerAlt,
  FaTasks,
  FaFileAlt,
  FaChartBar,
  FaRegAngry,
} from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

const Sidebar = ({ setShowAdminPanel }) => {
  const { role, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const handleAdminPage = () => {
    if (loading) return;
    if (role !== "admin") {
      console.log("Access Denied");
      return;
    }
    setShowAdminPanel(true);
    setOpen(false); // Close sidebar on mobile
  };

  const navLinks = [
    { icon: <FaTachometerAlt className="text-xl" />, label: "Dashboard", to: "/dashboard" },
    { icon: <FaTasks className="text-xl" />, label: "My Tasks", to: "/tasks" },
    { icon: <FaFileAlt className="text-xl" />, label: "Docs", to: "/docs" },
    { icon: <FaChartBar className="text-xl" />, label: "Reporting", to: "/reporting" },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <div className="md:hidden p-2 pt-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-64 p-5 bg-gray-900 text-white">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-bold">WBS</h1>
              {/* <X onClick={() => setOpen(false)} className="cursor-pointer" /> */}
            </div>
            <nav className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800"
                  onClick={() => setOpen(false)}
                >
                  {link.icon} <span>{link.label}</span>
                </Link>
              ))}
              {role === "admin" && (
                <button
                  onClick={handleAdminPage}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800 w-full text-left"
                >
                  <FaRegAngry className="text-xl" /> <span>Admin</span>
                </button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen w-64 bg-gray-900 text-white p-5 flex-col">
        <h1 className="text-xl font-bold mb-5">WBS</h1>
        <nav className="space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800"
            >
              {link.icon} <span>{link.label}</span>
            </Link>
          ))}
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
    </>
  );
};

export default Sidebar;
