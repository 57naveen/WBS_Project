const StatsCard = ({ title, count, percentage, color, icon: Icon }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
      <div className={`text-${color}-500 text-4xl`}>
        <Icon />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xl font-bold">{count}</p>
        <p className="text-sm text-gray-500">{percentage} Up this month</p>
      </div>
    </div>
  );
};

export default StatsCard;
