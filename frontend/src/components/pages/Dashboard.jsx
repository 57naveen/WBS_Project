import DashboardLayout from "../DashboardLayout";
import StatsCard from "../StatsCard";
import {
  FaProjectDiagram,
  FaTasks,
  FaClipboardCheck,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import TaskTable from "../TaskTable";
import ProjectCard from "../ProjectCard";
import { useEffect, useState } from "react";
import { fetchProjects, fetchTasks, fetchTeamMembers } from "../../utils/api";
import { toast } from "react-toastify";
import useWebSocket from "../../hooks/useWebSocket"; // ✅ WebSocket hook
import "react-toastify/dist/ReactToastify.css";
import TeamMember from "../TeamMember";
import AddProjectPopUp from "./AddProjectPopUp";
import { useMemo } from "react";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectDetails, setProjectDetails] = useState([]);
  const [addProjectPopup, setAddProjectPopup] = useState(false);

  // ✅ WebSocket Hook for real-time task updates
  const { data: webSocketTasks  } = useWebSocket("ws://127.0.0.1:8000/ws/tasks/");


useEffect(() => {
    if (webSocketTasks) {
        console.log("✅ Updating tasks state:", webSocketTasks);
        setTasks(webSocketTasks);
    }
}, [webSocketTasks]);

  // ✅ Fetch all initial data
  useEffect(() => {
    const loadData = async () => {
      const [proj, task, team] = await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchTeamMembers(),
      ]);
      setProjects(proj);
      setTasks(task);
      setTeamMembers(team);
    };
    loadData();
  }, []);

  // ✅ Fetch project details
  useEffect(() => {
    const fetch_ProjectData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/projects");
        const json = await response.json();
        setProjectDetails(json);
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };
    fetch_ProjectData();
  }, []);

  // ✅ Update tasks when new WebSocket data arrives
  // useEffect(() => {
  //   if (newTasks && newTasks.length > 0) {
  //       console.log("🔄 Updating tasks with new WebSocket data:", newTasks);
  
  //       setTasks((prevTasks) => {
  //           const taskMap = new Map(prevTasks.map(task => [task.id, task])); 
  
  //           newTasks.forEach((task) => {
  //               taskMap.set(task.id, task); // Update or add new task
  //           });
  
  //           const updatedTasks = Array.from(taskMap.values());
  //           console.log("✅ New Tasks after update:", updatedTasks);
  //           return updatedTasks;
  //       });
  
  //       newTasks.forEach((task) => {
  //           toast.info(`🔔 Task Updated: ${task.title} is now ${task.status}`);
  //       });
  //   }
  // }, []);

  // ✅ Compute Statistics Dynamically
  const stats = useMemo(() => {
    return [
      {
        title: "Total Projects",
        count: projects.length,
        percentage: "26%",
        color: "blue",
        icon: FaProjectDiagram,
      },
      {
        title: "Total Tasks",
        count: tasks.length, 
        percentage: ((tasks.length / (projects.length || 1)) * 100).toFixed(1) + "%",
        color: "green",
        icon: FaTasks,
      },
      {
        title: "Assigned Tasks",
        count: tasks.filter((task) => task.status === "Assigned").length,
        percentage: ((tasks.filter((task) => task.status === "Assigned").length / (tasks.length || 1)) * 100).toFixed(1) + "%",
        color: "yellow",
        icon: FaClipboardCheck,
      },
      {
        title: "Pending Tasks",
        count: tasks.filter((task) => task.status === "Pending").length,
        percentage: ((tasks.filter((task) => task.status === "Pending").length / (tasks.length || 1)) * 100).toFixed(1) + "%",
        color: "red",
        icon: FaClock,
      },
      {
        title: "Completed Tasks",
        count: tasks.filter((task) => task.status === "Completed").length,
        percentage: ((tasks.filter((task) => task.status === "Completed").length / (tasks.length || 1)) * 100).toFixed(1) + "%",
        color: "green",
        icon: FaCheckCircle,
      },
    ];
  }, [tasks, projects]);

  const handleAddProject =  () => {
    
    setAddProjectPopup(!addProjectPopup)
  
  };

 

  // useEffect(()=>
  // {
  //     handleAddProject();
  // },[])

  // const handleProjectSubmit = (data) => {
  //   console.log("Received Project Data:", data);
  //   setProjectData(data);
  // };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* ✅ Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
              <StatsCard key={`${stat.title}-${stat.count}`} {...stat} />
          ))}
      </div>

      {/* ✅ Projects Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6 ">
  <h2 className="text-xl font-bold mb-4 text-gray-800">
    Projects Overview
  </h2>
  <button
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
    onClick={handleAddProject}
  >
    + Add Project
  </button>

  {/* Scrollable Projects Container */}
  <div className="max-h-[300px] overflow-y-auto">

 
  <div className="mt-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} {...project} />
      ))}
    </div>
  </div>
  </div>
</div>

      {addProjectPopup && (
  <AddProjectPopUp 
    onClose={() => setAddProjectPopup(false)} 
    onSubmit={(newProject) => {
      // setProjects((prev) => [...prev, newProject]); // ✅ Update Projects
      fetchProjects().then(setProjects)
      fetchTasks().then(setTasks); // ✅ Refresh Tasks
    }} 
  />
)}
      

      {/* ✅ Task Table */}
      <div className="mt-6 mb-10">
        <h1 className="text-2xl font-bold mb-4">Tasks</h1>
        <TaskTable key={tasks.length} data={tasks} project={projectDetails} />
      </div>

      {/* ✅ Team Members */}
      <div className="mt-6 mb-10">
        <h1 className="text-2xl font-bold mb-4">Team Members</h1>
        <TeamMember />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
