import React from "react";

const TeamMember = ({ team, tasks, taskAssignment }) => {
  const employeeTaskCount = {};
  const employeeProjectCount = {};

  taskAssignment.forEach(({ employee, task }) => {
    if (!employeeTaskCount[employee]) {
      employeeTaskCount[employee] = 0;
      employeeProjectCount[employee] = new Set();
    }
    employeeTaskCount[employee] += 1;

    // Find the project ID from the tasks list
    const assignedTask = tasks.find((t) => t.id === task);
    if (assignedTask) {
      employeeProjectCount[employee].add(assignedTask.project_id);
    }
  });

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
  <div className="flex justify-between items-center pb-4 border-b">
    <h2 className="text-xl font-semibold">Team Members</h2>
    <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm">
      + Add New Member
    </button>
  </div>
  
  {/* Scrollable Table Container */}
  <div className="overflow-y-auto max-h-96">
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left border-b text-gray-600">
          <th className="py-2 px-4">Name</th>
          <th className="py-2 px-4">Email</th>
          <th className="py-2 px-4">Projects</th>
          <th className="py-2 px-4">Tasks Assigned</th>
          <th className="py-2 px-4">Skills</th>
          <th className="py-2 px-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {team.map((teamMember) => (
          <tr key={teamMember.id} className="border-b">
            <td className="flex items-center gap-2 py-2 px-4">
              <span className="text-blue-600 hover:underline cursor-pointer">
                {teamMember.name}
              </span>
            </td>
            <td className="py-2 px-4">{teamMember.email}</td>
            <td className="py-2 px-4">
              <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                {String(
                  employeeProjectCount[teamMember.id]
                    ? employeeProjectCount[teamMember.id].size
                    : 0
                ).padStart(2, "0")}
              </span>
            </td>
            <td className="py-2 px-4">
              <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                {String(employeeTaskCount[teamMember.id] || 0).padStart(2, "0")}
              </span>
            </td>
            <td className="py-2 px-4 text-gray-500">{teamMember.skills}</td>
            <td className="py-2 px-4 flex gap-2">
              <button className="text-gray-600 hover:text-gray-900">✔</button>
              <button className="text-gray-600 hover:text-gray-900">🖊</button>
              <button className="text-gray-600 hover:text-gray-900">😊</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
  );
};

export default TeamMember;
