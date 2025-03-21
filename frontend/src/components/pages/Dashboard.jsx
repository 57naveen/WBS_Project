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
import {
  fetchProjects,
  fetchTasks,
  fetchTeamMembers,
  fetchTaskAssignment,
} from "../../utils/api";
import { toast } from "react-toastify";
import useWebSocket from "../../hooks/useWebSocket"; // ✅ WebSocket hook
import "react-toastify/dist/ReactToastify.css";
import TeamMember from "../TeamMember";
import AddProjectPopUp from "./AddProjectPopUp";
import { useMemo } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useSelector } from "react-redux";

import { useAuth } from "../../utils/AuthContext";
import Login from "../Login";
import AdminPanel from "../AdminPanel";
import Employees from "../Employees";

const Dashboard = ({showAdminPanel}) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectDetails, setProjectDetails] = useState([]);
  const [addProjectPopup, setAddProjectPopup] = useState(false);
  const [taskAssignment, setTaskAssignement] = useState([]);
  const { user, role, loading } = useAuth();
  const userLogged = useSelector((state) => state.user);

  console.log("user:",user);
  console.log("role:",role);
  // console.log("loading:",loading);


  

  // ✅ WebSocket Hook for real-time task updates
  const { data: webSocketTasks } = useWebSocket(
    "ws://127.0.0.1:8000/ws/tasks/"
  );

  // console.log("Task", tasks);
  // console.log("TaskAssigment", taskAssignment);

  useEffect(() => {
    if (webSocketTasks && webSocketTasks.length > 0) {
      // console.log("✅ Updating tasks state:", webSocketTasks);

      setTasks((prevTasks) => {
        const taskMap = new Map(prevTasks.map((task) => [task.id, task]));

        webSocketTasks.forEach((task) => {
          if (!task.project_id) {
            console.warn("⚠️ Task missing project_id:", task);
          }
          taskMap.set(task.id, task); // Update existing or add new task
        });

        const updatedTasks = Array.from(taskMap.values());
        // console.log("✅ New Tasks after update:", updatedTasks);
        return updatedTasks;
      });
    }
  }, [webSocketTasks]);

  // ✅ Fetch all initial data
  useEffect(() => {
    const loadData = async () => {
      const [proj, task, team, taskAssignment] = await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchTeamMembers(),
        fetchTaskAssignment(),
      ]);
      setProjects(proj);
      setTasks(task);
      setTeamMembers(team);
      setTaskAssignement(taskAssignment);
    };
    loadData();
  }, []);

  // ✅ Fetch project details
  useEffect(() => {
    const fetch_ProjectData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/projects");
        const json = await response.json();
        // console.log("project data", json);
        setProjectDetails(json);
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };
    fetch_ProjectData();
  }, []);

  // ✅ Update tasks when new WebSocket data arrives
  useEffect(() => {
    if (webSocketTasks && webSocketTasks.length > 0) {
      // console.log("✅ WebSocket Data Received:", webSocketTasks);

      setTasks((prevTasks) => {
        const taskMap = new Map(prevTasks.map((task) => [task.id, task]));

        webSocketTasks.forEach((task) => {
          if (taskMap.has(task.id)) {
            taskMap.set(task.id, { ...taskMap.get(task.id), ...task });
          } else {
            taskMap.set(task.id, task);
          }
        });

        const updatedTasks = Array.from(taskMap.values());
        // console.log("✅ New Tasks after update:", updatedTasks);
        return updatedTasks;
      });

      webSocketTasks.forEach((task) => {
        // toast.info(`🔔 Task Updated: ${task.title}`);
      });
    }
  }, [webSocketTasks]);

  // ✅ Compute Statistics Dynamically
  const stats = useMemo(() => {
    return [
      {
        title: "Total Projects",
        count: projects.length,
        percentage: 100, // Full progress since it's just a count
        color: "#007bff", // Blue
      },
      {
        title: "Total Tasks",
        count: tasks.length,
        percentage: ((tasks.length / (projects.length || 1)) * 100).toFixed(1),
        color: "#28a745", // Green
      },
      {
        title: "Assigned Tasks",
        count: tasks.filter((task) => task.status === "Assigned").length,
        percentage: (
          (tasks.filter((task) => task.status === "Assigned").length /
            (tasks.length || 1)) *
          100
        ).toFixed(1),
        color: "#ffc107", // Yellow
      },
      {
        title: "Pending Tasks",
        count: tasks.filter((task) => task.status === "Pending").length,
        percentage: (
          (tasks.filter((task) => task.status === "Pending").length /
            (tasks.length || 1)) *
          100
        ).toFixed(1),
        color: "#dc3545", // Red
      },
      {
        title: "Completed Tasks",
        count: tasks.filter((task) => task.status === "Completed").length,
        percentage: (
          (tasks.filter((task) => task.status === "Completed").length /
            (tasks.length || 1)) *
          100
        ).toFixed(1),
        color: "#28a745", // Green
      },
    ];
  }, [tasks, projects]);

  const StatsCard = ({ title, count, percentage, color }) => {
    return (
      <div className="flex flex-col items-center bg-white shadow-lg p-6 rounded-2xl transition-transform hover:scale-105 border border-gray-200">
        {/* Circular Progress Bar */}
        <div className="w-28 h-24 mb-5">
          <CircularProgressbar
            value={parseFloat(percentage)}
            text={`${percentage}%`}
            styles={buildStyles({
              pathColor: color,
              textColor: "#333",
              trailColor: "#f3f3f3",
              textSize: "16px",
            })}
          />
        </div>

        {/* Stat Details */}
        <h3 className="text-lg font-bold text-gray-700">{title}</h3>
        <p className="text-xl font-semibold text-gray-900">{count}</p>
      </div>
    );
  };

  const handleAddProject = () => {
    setAddProjectPopup(!addProjectPopup);
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
       
       {showAdminPanel && role === "admin" &&
        <AdminPanel /> }
     
      {!userLogged && (
        <div className="absolute inset-0 flex justify-center items-center bg-black/10 backdrop-blur-sm z-[1000]">
          <Login />
        </div>
      )
     }


     { user && role === "employee" && (
     <Employees />
     )}
 
  

  {user && role === "manager" && (
    <>
    <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
    
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
    {stats.map((stat) => (
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
            fetchProjects().then(setProjects);
            fetchTasks().then(setTasks); // ✅ Refresh Tasks
          }}
        />
      )}

      {/* ✅ Task Table */}
      <div className="mt-6 mb-10">
        <h1 className="text-2xl font-bold mb-4">Tasks</h1>
        {projectDetails.length > 0 && (
          <TaskTable key={tasks.length} data={tasks} projects={projects} />
        )}
      </div>

      {/* ✅ Team Members */}
      <div className="mt-6 mb-10">
        <h1 className="text-2xl font-bold mb-4">Team Members</h1>
        <TeamMember
          team={teamMembers}
          tasks={tasks}
          taskAssignment={taskAssignment}
        />
      </div>
      </>
)}
    </DashboardLayout>
  );
};

export default Dashboard;
