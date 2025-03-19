import React, { useState,useMemo} from "react";
import axios from "axios";
import { toast } from "react-toastify";

const TaskTable = ({ data,projects }) => {
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
  
      // console.log("API Response:", response.data);
  
      if (response.data.task_id) {  // ✅ Check if task_id exists
        toast.warn(response.data.message || "No tasks assigned.");
        pollTaskResult(response.data.task_id);  // ✅ Start polling for results
      } else {
        toast.warn(response.data.message || "No tasks assigned.");
      }
    } catch (error) {
      toast.error("Task assignment failed!");
      // console.log("Error:", error.response ? error.response.data : error);
    }
  };

  let pendingToastShown = false; // Move outside of interval function

  const pollTaskResult = async (taskId) => {
      let attempts = 0;
      const maxAttempts = 10; // Max wait ~10s
    
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/task-result/${taskId}/`);
          // console.log("Task Result Response:", response.data);
          
          const { status, message, assigned_tasks, skipped_reasons,unassigned_tasks_Message } = response.data;
  
          if (status === "success") {
            clearInterval(interval);
            setRowSelection({});
    
            // ✅ Show assigned tasks
            assigned_tasks.forEach((task) => {
              toast.success(`Task "${task.task_id}" assigned to ${task.employee_id}`);
            });
    
            // ✅ If skipped reasons exist, show them too
            if (skipped_reasons.length > 0) {
              toast.warn(`Some tasks were skipped:\n${skipped_reasons.join("\n")}`);
            }
          } 
          else if (response.data.status === "warning") {
            clearInterval(interval);
            toast.warn(response.data.message); // "No tasks assigned."
            setRowSelection({});
    
            // ✅ Show skipped reasons in separate toasts
            response.data.skipped_reasons.forEach((reason) => {
              setTimeout(() => {
                toast.warn(reason);
              }, 3000);
              
            });

          
          }
          else if (response.data.status === "pending") {
            if (!pendingToastShown) {
              toast.warn(response.data.message);
              pendingToastShown = true;
              setRowSelection({});
              // Reset flag after 5 seconds
              setTimeout(() => {
                pendingToastShown = false;
              }, 5000);
            }
          }
          else if (response.data.status === "processing") {
            toast.info(response.data.message);
          } 
          else if (response.data.status === "error") {
            clearInterval(interval);
            toast.error(response.data.message);
            setRowSelection({});
          } 
  
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            toast.warn("Task is taking too long to process.");
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
          const taskProject = projects.find(proj => proj.id === task.project_id) || null;

          
            if (!taskProject) {
              console.warn(`⚠️ No project found for task ${task.id} (project_id: ${task.project_id})`);
            }

          // console.log("taskProject :", taskProject)

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
              <td className="px-4 py-2">{taskProject ? taskProject.name : "Loading..."}</td>
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
