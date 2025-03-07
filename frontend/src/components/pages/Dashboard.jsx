import DashboardLayout from "../DashboardLayout";
import StatsCard from "../StatsCard";
import {
  FaProjectDiagram,
  FaTasks,
  FaClipboardCheck,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import TaskList from "../TaskList";
import ProjectCard from "../ProjectCard";
import TeamTable from "../TeamTable";
import { useEffect, useState } from "react";
import { fetchProjects, fetchTasks, fetchTeamMembers } from "../../utils/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

 

  useEffect(() => {
    const loadData = async () => {
      setProjects(await fetchProjects());
      setTasks(await fetchTasks());
      setTeamMembers(await fetchTeamMembers());
    };
    loadData();
    

    // WebSocket for Live Task Updates
    const socket = new WebSocket("ws://http://127.0.0.1:8000/ws/tasks/");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Update Task List in Real-Time
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === data.task_id ? { ...task, status: data.status } : task
        )
      );

      

      // Show Notification for New Tasks
      toast.info(`Task Updated: ${data.title} is now ${data.status}`);
    };

    return () => socket.close();
  }, []);

  console.log("TASKSAAAAAAAA",tasks)

  // Compute Statistics Dynamically
  const stats = [
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
      percentage: "13%",
      color: "green",
      icon: FaTasks,
    },
    {
      title: "Assigned Tasks",
      count: tasks.filter((task) => task.status == "Assigned").length,
      percentage: "23%",
      color: "yellow",
      icon: FaClipboardCheck,
    },
    {
      title: "Pending Tasks",
      count: tasks.filter((task) => task.status == "Pending").length,
      percentage: "14%",
      color: "red",
      icon: FaClock,
    },
    {
      title: "Completed Tasks",
      count: tasks.filter((task) => task.status === "Completed").length,
      percentage: "35%",
      color: "green",
      icon: FaCheckCircle,
    },
  ];

  // Categorizing Tasks
  const upcomingTasks = tasks.filter(
    (task) =>
      new Date(task.due_date) >= new Date() && task.status !== "Completed"
  );
  const overdueTasks = tasks.filter(
    (task) =>
      new Date(task.due_date) < new Date() && task.status !== "Completed"
  );
  const completedTasks = tasks.filter((task) => task.status === "Completed");

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Assigned Tasks Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Assigned Tasks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <span className="w-full text-center p-2 border font-bold text-sm border-gray-300 rounded-lg cursor-pointer bg-white">
              Upcoming Tasks
            </span>
            <span className="w-full text-center p-2 border font-bold text-sm border-gray-300 rounded-lg cursor-pointer bg-white">
              Overdue Tasks
            </span>
            <span className="w-full text-center p-2  font-bold border text-sm border-gray-300 rounded-lg cursor-pointer bg-white">
              Completed Tasks
            </span>
          </div>
          <div className="border m-6  text-center  border-gray-300"></div>
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 " >
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h1>GRavity</h1>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h1>GRavity</h1>
              </div>
          </div> */}
          <TaskList task={tasks} />
        </div>
        

        {/* Projects Overview */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Projects Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </div>

     

      </div>

      {/* Team Members Table */}
      {/* <div className="mt-6">
        <TeamTable members={teamMembers} />
      </div> */}
    </DashboardLayout>
  );
};

export default Dashboard;
