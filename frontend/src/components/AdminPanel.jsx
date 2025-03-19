import { useEffect, useState } from "react";
import { db } from "../utils/firebase"; 
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setLoading(false);
    };

    fetchUsers(); 
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });

      // Update state locally after Firestore update
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      alert("User role updated successfully!");
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role.");
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Panel - Manage User Roles</h1>
      <table className="min-w-full bg-white border border-gray-200 shadow-md">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">Email</th>
            <th className="py-2 px-4 border">Role</th>
            <th className="py-2 px-4 border">Update Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="py-2 px-4 border">{user.email}</td>
              <td className="py-2 px-4 border">{user.role || "N/A"}</td>
              <td className="py-2 px-4 border">
                <select
                  value={user.role || ""}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="border p-2"
                >
                  <option value="">Select Role</option>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
