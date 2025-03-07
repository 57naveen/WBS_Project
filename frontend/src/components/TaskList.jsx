const TaskList = ({ title, task  }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* <h2 className="text-lg font-semibold mb-3">{title}</h2> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 p-2">
        {task.length > 0 ? (
          task.map((info) => (
            <div key={info.id} className="p-4 border border-gray-300 rounded-md shadow-sm">
              <h1 className="text-gray-950 font-medium text-sm mb-3">{info.title}</h1>
              <span className="text-xs border p-1 font-medium border-gray-300 rounded-xl">Due Date: {info.deadline}</span> <span className="text-xs border p-1 text-amber-600 font-medium border-gray-300 rounded-xl">{info.priority}</span>
              <p className="py-4 text-sm"><span className="font-medium">Required Skills:</span> {info.required_skills}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No tasks available</p>
        )}
      </div>
    </div>
  );
};

export default TaskList;
