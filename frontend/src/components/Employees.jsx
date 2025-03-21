import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion"; // For smooth animations
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { removeUser } from "@/utils/userSlice";

const Employees = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [taskUpdates, setTaskUpdates] = useState({});
  const [selectedProject, setSelectedProject] = useState(null); // Track selected project
  const user = useSelector((state) => state.user);
  const[data, setData] = useState({});
  const [activeTab, setActiveTab] = useState("Assigned"); 
  const dispatch = useDispatch(); // ✅ Redux hook
  // const navigate = useNavigate(); // ✅ React Router hook for navigation
  const userLogged = useSelector((state) => state.user); // Get logged-in user

  const categorizedTasks = {
    Assigned: employeeData?.tasks.filter((task) => task.project?.id === selectedProject && task.status === "Assigned"),
    Pending: employeeData?.tasks.filter((task) => task.project?.id === selectedProject && task.status === "Pending"),
    Completed: employeeData?.tasks.filter((task) => task.project?.id === selectedProject && task.status === "Completed"),
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const token = localStorage.getItem("firebase_token");
      if (!token) {
        console.error("❌ No Firebase token found!");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/get-employee-data/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = await response.json();
        setEmployeeData(data);
        setSelectedProject(data.projects.length > 0 ? data.projects[0].id : null); // Default to first project
      } catch (err) {
        console.error("❌ Error fetching employee data:", err);
      }
    };

    fetchEmployeeData();
  }, [user]);

  const handleTaskUpdate = async (taskId) => {
    const updatedProgress = parseInt(taskUpdates[taskId]?.progress || 0, 10);
    const updatedComment = taskUpdates[taskId]?.comment || "";

    if (updatedProgress < 1 || updatedProgress > 100) {
      alert("Progress must be between 1 and 100.");
      return;
    }

    // ✅ Check if task is already completed before making an API request
    const taskToUpdate = employeeData.tasks.find((task) => task.id === taskId);
    if (taskToUpdate?.status === "Completed") {
      alert("⚠️ Task is already marked as completed. No further updates allowed.");
      return;
    }

    try {
      const token = localStorage.getItem("firebase_token");
      if (!token) {
        console.error("❌ No Firebase token found!");
        alert("Session expired. Please log in again.");
        dispatch(removeUser()); // ✅ Remove user from Redux store
        // navigate("/login"); // ✅ Redirect to login page
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/update-task/${taskId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ progress: updatedProgress, comment: updatedComment }),
      });

      if (response.status === 401 || response.status === 403) {
        console.error("❌ Unauthorized or token expired. Redirecting to login...");
        alert("Session expired. Please log in again.");
        localStorage.removeItem("firebase_token"); // ✅ Clear expired token
        // navigate("/login"); // ✅ Redirect to login page
        dispatch(removeUser());
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Task Updated:", data);

      if (!data.task) {
        console.error("❌ No task data returned from backend.");
        return;
      }

      // ✅ If progress is 100%, mark task as "Completed"
      if (updatedProgress === 100) {
        alert("🎉 Task marked as completed!");
      }

      // ✅ Update UI
      setEmployeeData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === taskId
            ? { ...task, progress: data.task.progress, status: data.task.status, comment: data.task.comment }
            : task
        ),
      }));
    } catch (err) {
      console.error("❌ Error updating task:", err);
    }
  };

  if (!employeeData)
    return <p className="text-center text-lg font-semibold text-white">Loading employee details...</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Employee Info Card */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg p-6 rounded-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{employeeData.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Email:</strong> {employeeData.email}</p>
            <p><strong>Role:</strong> {employeeData.role}</p>
            <p><strong>Skills:</strong> {employeeData.skills.join(", ")}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects - Horizontal Scroll List */}
      <div className="overflow-x-auto whitespace-nowrap py-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <h2 className="text-xl font-bold mb-2 ">Projects</h2>
        <div className="flex space-x-4">
          {employeeData?.projects.map((project) => (
            <motion.div
              key={project.id}
              whileTap={{ scale: 0.95 }}
              className={`cursor-pointer bg-gray-800 text-white px-6 py-3 rounded-md shadow-lg transition-all ${
                selectedProject === project.id ? "ring-2 ring-blue-400" : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => setSelectedProject(project.id)}
            >
              <p className="text-lg font-semibold">{project.name}</p>
              <p className="text-sm opacity-80">Deadline: {project.deadline}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tasks for Selected Project */}
      <div>
      {/* Header Section with Tab Buttons */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold">
          Tasks for {employeeData?.projects.find((p) => p.id === selectedProject)?.name || "Project"}
        </h2>

        {/* Tabs for Task Filtering */}
        <div className="flex space-x-3">
          {["Assigned", "Pending", "Completed"].map((status) => (
            <button
              key={status}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === status ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setActiveTab(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="grid md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 p-2">
        {categorizedTasks[activeTab].length > 0 ? (
          categorizedTasks[activeTab].map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="shadow-lg p-4 rounded-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p><strong>Status:</strong> {task.status}</p>
                  <p>
                    <strong>Priority:</strong>{" "}
                    <span
                      className={`px-2 py-1 rounded-md text-white ${
                        task.priority === "High" ? "bg-red-500" : "bg-yellow-500"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </p>
                  <p><strong>Deadline:</strong> {task.deadline}</p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <p className="text-sm">Task Progress:</p>
                    <Progress value={taskUpdates[task.id]?.progress || task.progress || 0} className="h-2" />
                  </div>

                  {/* Progress Input */}
                  <Input
                    type="number"
                    placeholder="Update progress (0-100)"
                    min="0"
                    max="100"
                    className="placeholder-gray-400"
                    value={taskUpdates[task.id]?.progress || ""}
                    onChange={(e) =>
                      setTaskUpdates((prev) => ({
                        ...prev,
                        [task.id]: { ...prev[task.id], progress: e.target.value },
                      }))
                    }
                  />

                  {/* Comment Box */}
                  <Textarea
                    placeholder="Add a comment..."
                    className="placeholder-gray-400"
                    value={taskUpdates[task.id]?.comment || ""}
                    onChange={(e) =>
                      setTaskUpdates((prev) => ({
                        ...prev,
                        [task.id]: { ...prev[task.id], comment: e.target.value },
                      }))
                    }
                  />

                  {/* Update Button */}
                  <Button
                    onClick={() => handleTaskUpdate(task.id)}
                    className="w-full mt-2 bg-blue-500 hover:bg-blue-600 transition-all"
                  >
                    Update Task
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-400">No {activeTab.toLowerCase()} tasks for this project.</p>
        )}
      </div>
    </div>


    </div>
  );
};

export default Employees;
