import React, { useState,useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const TaskTable = ({ data, projects }) => {
  const [rowSelection, setRowSelection] = useState({});
  const [editableRowData, setEditableRowData] = useState({});
  const [taskData, setTaskData] = useState(data); // initialize with props

  const toggleRowSelection = (rowId) => {
    setRowSelection((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  useEffect(() => {
    setTaskData(data);
  }, [data]);

  
  const handleInputChange = (taskId, field, value) => {
    setEditableRowData((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  const updateTaskInDB = async (taskId) => {
    try {
      const updatedData = editableRowData[taskId];
      const response = await axios.patch(
        `http://localhost:8000/api/tasks/${taskId}/`,
        updatedData
      );
  
      toast.success(`Task ${taskId} updated!`);
  
      // 🔄 Update the row in local state without changing order
      setTaskData((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...response.data } : task
        )
      );
  
      // Clear the edited state for this row
      setEditableRowData((prev) => {
        const newData = { ...prev };
        delete newData[taskId];
        return newData;
      });
    } catch (error) {
      toast.error(`Failed to update task ${taskId}.`);
      console.error(error);
    }
  };

  const hasUnsavedChanges = () => {
    return data.some((task) => {
      const editable = editableRowData[task.id];
      return (
        editable &&
        (
          editable.title !== undefined && editable.title !== task.title ||
          editable.description !== undefined && editable.description !== task.description ||
          editable.deadline !== undefined && editable.deadline !== task.deadline ||
          editable.status !== undefined && editable.status !== task.status ||
          editable.priority !== undefined && editable.priority !== task.priority
        )
      );
    });
  };

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

      if (response.data.task_id) {
        toast.warn(response.data.message || "No tasks assigned.");
        pollTaskResult(response.data.task_id);
      } else {
        toast.warn(response.data.message || "No tasks assigned.");
      }
    } catch (error) {
      toast.error("Task assignment failed!");
    }
  };

  let pendingToastShown = false;

  const pollTaskResult = async (taskId) => {
    let attempts = 0;
    const maxAttempts = 10;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/task-result/${taskId}/`);
        const { status, message, assigned_tasks, skipped_reasons } = response.data;

        if (status === "success") {
          clearInterval(interval);
          setRowSelection({});
          assigned_tasks.forEach((task) => {
            toast.success(`Task "${task.task_id}" assigned to ${task.employee_id}`);
          });
          if (skipped_reasons.length > 0) {
            toast.warn(`Some tasks were skipped:\n${skipped_reasons.join("\n")}`);
          }
        } else if (status === "warning") {
          clearInterval(interval);
          toast.warn(message);
          setRowSelection({});
          skipped_reasons.forEach((reason) => {
            setTimeout(() => {
              toast.warn(reason);
            }, 3000);
          });
        } else if (status === "pending") {
          if (!pendingToastShown) {
            toast.warn(message);
            pendingToastShown = true;
            setRowSelection({});
            setTimeout(() => {
              pendingToastShown = false;
            }, 5000);
          }
        } else if (status === "processing") {
          toast.info(message);
        } else if (status === "error") {
          clearInterval(interval);
          toast.error(message);
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
    }, 2000);
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-md">
      <div className="overflow-auto max-h-96">
        <table className="w-full border border-gray-700 text-sm">
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
              const taskProject = projects.find((proj) => proj.id === task.project_id) || {};
              const editable = editableRowData[task.id] || {};

              return (
                <tr key={task.id} className="hover:bg-gray-800">
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-green-500"
                      checked={rowSelection[index] || false}
                      onChange={() => toggleRowSelection(index)}
                    />
                  </td>
                  <td className="px-4 py-2">{task.id}</td>
                  <td className="px-4 py-2">{taskProject.name || "Loading..."}</td>

                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className={`w-full bg-gray-800 border rounded px-2 py-1 ${
                        editable.title !== undefined && editable.title !== task.title
                          ? "border-yellow-400 bg-yellow-900"
                          : "border-gray-700"
                      }`}
                      value={editable.title ?? task.title}
                      onChange={(e) => handleInputChange(task.id, "title", e.target.value)}
                    />
                  </td>

                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className={`w-full bg-gray-800 border rounded px-2 py-1 ${
                        editable.description !== undefined && editable.description !== task.description
                          ? "border-yellow-400 bg-yellow-900"
                          : "border-gray-700"
                      }`}
                      value={editable.description ?? task.description}
                      onChange={(e) => handleInputChange(task.id, "description", e.target.value)}
                    />
                  </td>

                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className={`w-full bg-gray-800 border rounded px-2 py-1 ${
                        editable.deadline !== undefined && editable.deadline !== task.deadline
                          ? "border-yellow-400 bg-yellow-900"
                          : "border-gray-700"
                      }`}
                      value={editable.deadline ?? task.deadline}
                      onChange={(e) => handleInputChange(task.id, "deadline", e.target.value)}
                    />
                  </td>

                  <td className="px-4 py-2">
                    <select
                      className={`w-full bg-gray-800 border rounded px-2 py-1 ${
                        editable.status !== undefined && editable.status !== task.status
                          ? "border-yellow-400 bg-yellow-900"
                          : "border-gray-700"
                      }`}
                      value={editable.status ?? task.status}
                      onChange={(e) => handleInputChange(task.id, "status", e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  <td className="px-4 py-2">
                    <select
                      className={`w-full bg-gray-800 border rounded px-2 py-1 ${
                        editable.priority !== undefined && editable.priority !== task.priority
                          ? "border-yellow-400 bg-yellow-900"
                          : "border-gray-700"
                      }`}
                      value={editable.priority ?? task.priority}
                      onChange={(e) => handleInputChange(task.id, "priority", e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </td>

                 
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4">
        <button
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          onClick={sendSelectedTasks}
        >
          Send Selected Tasks
        </button>

        {hasUnsavedChanges() && (
          <button
            onClick={() => {
              Object.keys(editableRowData).forEach((taskId) => {
                const task = data.find((t) => t.id.toString() === taskId.toString());
                const editable = editableRowData[taskId];

                if (
                  editable &&
                  (
                    editable.title !== task.title ||
                    editable.description !== task.description ||
                    editable.deadline !== task.deadline ||
                    editable.status !== task.status ||
                    editable.priority !== task.priority
                  )
                ) {
                  updateTaskInDB(taskId);
                }
              });
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskTable;
