import { useEffect, useState } from "react";

import { fetchProjects } from "../../utils/api"; 

const Projects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const getProjects = async () => {
      const data = await fetchProjects();
      setProjects(data);
    };

    getProjects();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      <div className="bg-white p-4 rounded shadow">
        {projects.length > 0 ? (
          <ul>
            {projects.map((project) => (
              <li key={project.id} className="p-2 border-b">
                {project.name} - {project.description} - {project.deadline}
              </li>
            ))}
          </ul>
        ) : (
          <p>No projects found.</p>
        )}
      </div>
    </div>
  );
};

export default Projects;
