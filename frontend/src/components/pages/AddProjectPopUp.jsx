import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddProjectPopUp = ({onClose, onSubmit }) => {
  const [project, setProject] = useState({
    project_name: "",
    project_description: "",
    deadline: "",
  });

  const handleChange = (e) => {
    setProject({
      ...project,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    // ✅ Convert date to ISO format (YYYY-MM-DD)
    const formattedDate = new Date(project.deadline).toISOString().split("T")[0];

    const projectData = {
      project_name: project.project_name,
      project_description: project.project_description,
      deadline: formattedDate, // ✅ Format date correctly
    };

    // console.log("📤 Sending data:", projectData);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/task-breakdown/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorResponse = await response.text(); // ✅ Capture response details
        console.error("❌ API Response:", errorResponse);
        toast.error(errorResponse.error || "Something went wrong!");
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      // console.log("✅ Project added successfully:", result);
      toast.success(result.message || "Project added successfully!");
      setTimeout(() => {
        toast.success(result.tasks_count+" New Task Added");
      }, 3000);

      if (onSubmit) onSubmit(result);

      onClose();
      
      if (onSubmit) onSubmit(result);
    } catch (error) {
      console.error("❌ Error adding project:", error);
      toast.error("Failed to add project.");
    }
  };

  return (
<div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50">
  <div className="bg-white/80 p-6 rounded-lg shadow-lg w-96 backdrop-blur-lg">
    <h2 className="text-xl font-semibold mb-4 text-gray-900">Add New Project</h2>

    <label className="block mb-2 text-gray-700">Project Name</label>
    <input
      className="w-full border rounded p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/60"
      type="text"
      name="project_name"
      value={project.project_name}
      onChange={handleChange}
      placeholder="Enter project name"
    />

    <label className="block mb-2 text-gray-700">Project Description</label>
    <textarea
      className="w-full border rounded p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/60"
      name="project_description"
      value={project.project_description}
      onChange={handleChange}
      placeholder="Enter project description"
    />

    <label className="block mb-2 text-gray-700">Deadline</label>
    <input
      className="w-full border rounded p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/60"
      type="date"
      name="deadline"
      value={project.deadline}
      onChange={handleChange}
      
    />

    <div className="flex justify-end space-x-2">
      <button
        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
        onClick={onClose}
      >
        Cancel
      </button>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  </div>
</div>

);  
};

export default AddProjectPopUp;
