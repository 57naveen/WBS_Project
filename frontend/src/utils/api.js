import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api"; // Update with your backend URL

export const fetchProjects = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/projects/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
};




export const fetchTasks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/tasks/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};


export const fetchTeamMembers = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/employees/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching fetchTeamMembers:", error);
    return [];
  }
};

// export const fetchTeamMembers = async () => {
//   try {
//     const response = await fetch("http://localhost:8000/api/team-members/");
//     return await response.json();
//   } catch (error) {
//     console.error("Error fetching team members:", error);
//     return [];
//   }
// };