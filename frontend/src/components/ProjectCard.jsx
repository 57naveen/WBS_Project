import { FaUsers } from "react-icons/fa";

const ProjectCard = ({ name, progress, team = [] }) => {
  console.log("ProjectCard received team:", team); // Debugging
  console.log("name received team:", name); // Debugging
  console.log("progress received team:", progress); // Debugging

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">{name}</h2>
      <div className="relative w-full h-2 bg-gray-200 rounded-full mt-2">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex items-center mt-3">
        <FaUsers className="text-gray-500 mr-2" />
        {Array.isArray(team) && team.length > 0 ? (
          team.map((member, index) => (
            <img
              key={index}
              src={member.avatar}
              alt={member.name || "Team Member"}
              className="w-6 h-6 rounded-full border-2 border-white -ml-2"
            />
          ))
        ) : (
          <span className="text-gray-500 text-sm">No team members</span>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
