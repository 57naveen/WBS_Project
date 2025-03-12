import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const TaskTable = ({ data,project }) => {
  const [rowSelection, setRowSelection] = useState({});

  // Toggle selection state
  const toggleRowSelection = (rowId) => {
    setRowSelection((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

// const socket = new WebSocket("ws://localhost:8000/ws/task_updates/");

// socket.onmessage = (event) => {
//   const data = JSON.parse(event.data);
//   console.log("📩 Received task update:", data);
//   alert(data.message); // Show alert or update UI
// };

  // Send selected tasks to the backend
  const sendSelectedTasks = async () => {
    const selectedRows = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => data[key]);
  
    if (selectedRows.length === 0) {
      alert("Please select tasks to send.");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:8000/api/assign-tasks/", {
        tasks: selectedRows,
      });
  
      console.log("API Response:", response.data);
  
      if (response.data.task_id) {  // ✅ Check if task_id exists
        toast.warn(response.data.message || "No tasks assigned.");
        pollTaskResult(response.data.task_id);  // ✅ Start polling for results
      } else {
        toast.warn(response.data.message || "No tasks assigned.");
      }
    } catch (error) {
      toast.error("Task assignment failed!");
      console.log("Error:", error.response ? error.response.data : error);
    }
  };

  const pollTaskResult = async (taskId) => {
    let attempts = 0;
    const maxAttempts = 10; // Wait max ~10s
  
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/task-result/${taskId}/`);
        console.log("Task Result Response:", response.data);
        setRowSelection({});
        if (response.data.status === "success") {
          clearInterval(interval);
          response.data.assigned_tasks.forEach((task) => toast.success(task));
        }else if (response.data.status === "Pending"){
          toast.warn(response.data.message || "Pending");
        }
         else if (response.data.status === "error") { // ✅ Handle errors properly
          clearInterval(interval);
          toast.error(response.data.message);  // Show error message
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          toast.warn("Task is taking too long.");
        }
      } catch (error) {
        clearInterval(interval);
        toast.error("Error fetching task result.");
        console.error("Error fetching task result:", error);
      }
      attempts++;
    }, 2000); // Poll every 2 seconds
  };



  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-md">
      <div className="overflow-auto max-h-96">
        <table className="w-full border border-gray-700">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-2">✔</th>
              <th className="px-4 py-2">No.</th>
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Deadline</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Priority</th>
            </tr>
          </thead>
          <tbody>
        {data.map((task, index) => {
          // Find the matching project for the current task
          const taskProject = project.find((p) => p.id === task.project) || {};

          return (
            <tr key={index} className="hover:bg-gray-800">
              <td className="px-4 py-2 text-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-green-500"
                  checked={rowSelection[index] || false}
                  onChange={() => toggleRowSelection(index)}
                />
              </td>
              <td className="px-4 py-2">{task.id}</td>
              <td className="px-4 py-2">{taskProject.name || "No Project"}</td>
              <td className="px-4 py-2">{task.title}</td>
              <td className="px-4 py-2">{task.description}</td>
              <td className="px-4 py-2">{task.deadline}</td>
              <td className="px-4 py-2">{task.status}</td>
              <td className="px-4 py-2">{task.priority}</td>
            </tr>
          );
        })}
      </tbody>
        </table>
      </div>
      <button
        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        onClick={sendSelectedTasks}
      >
        Send Selected Tasks
      </button>
    </div>
  );
};

export default TaskTable;
