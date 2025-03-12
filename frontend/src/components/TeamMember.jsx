import React from 'react'

const TeamMember = () => {

  const employees = [
    {
      id: 1,
      name: "Ronald Richards",
      email: "debra.holt@example.com",
      projects: 2,
      tasksAssigned: 16,
      addedOn: "Tue 02 Jun, 2020 11:05 am",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    {
      id: 2,
      name: "Darlene Robertson",
      email: "bill.sanders@example.com",
      projects: 2,
      tasksAssigned: 16,
      addedOn: "Fri 05 Jun, 2020 06:31 am",
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    {
      id: 3,
      name: "Brooklyn Simmons",
      email: "sara.cruz@example.com",
      projects: 2,
      tasksAssigned: 16,
      addedOn: "Wed 17 Jun, 2020 02:57 pm",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    {
      id: 4,
      name: "Kristin Watson",
      email: "curtis.weaver@example.com",
      projects: 2,
      tasksAssigned: 16,
      addedOn: "Tue 09 Jun, 2020 04:30 pm",
      avatar: "https://randomuser.me/api/portraits/women/4.jpg",
    },
    {
      id: 5,
      name: "Cody Fisher",
      email: "debbie.baker@example.com",
      projects: 2,
      tasksAssigned: 16,
      addedOn: "Wed 17 Jun, 2020 06:49 am",
      avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    },
  ];


  return (
     <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex justify-between items-center pb-4 border-b">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm">
          + Add New Member
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full mt-4">
          <thead>
            <tr className="text-left border-b text-gray-600">
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Project</th>
              <th className="py-2 px-4">Task Assigned</th>
              <th className="py-2 px-4">Added On</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b">
                <td className="flex items-center gap-2 py-2 px-4">
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-blue-600 hover:underline cursor-pointer">
                    {employee.name}
                  </span>
                </td>
                <td className="py-2 px-4">{employee.email}</td>
                <td className="py-2 px-4">
                  <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                    {String(employee.projects).padStart(2, "0")}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                    {String(employee.tasksAssigned).padStart(2, "0")}
                  </span>
                </td>
                <td className="py-2 px-4 text-gray-500">{employee.addedOn}</td>
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
  )
}

export default TeamMember