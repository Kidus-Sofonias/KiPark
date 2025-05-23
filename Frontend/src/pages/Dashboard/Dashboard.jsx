import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    openSpaces: 0,
    checkedIn: 0,
    checkedOut: 0,
    totalCars: 0,
    totalEarnings: 0,
    cars: [],
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [newSpaces, setNewSpaces] = useState("");
  const [timeStats, setTimeStats] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTimeStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/parking/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err.response?.data?.error);
    }
  };

  const fetchTimeStats = async () => {
    try {
      const res = await api.get("/parking/time-checkins");
      setTimeStats(res.data);
    } catch (err) {
      console.error("Failed to load time stats:", err.response?.data?.error);
    }
  };

  const updateSpaces = async (e) => {
    e.preventDefault();
    if (!newSpaces || isNaN(newSpaces) || newSpaces < 0) {
      alert("Please enter a valid number");
      return;
    }

    try {
      await api.put("/parking/update-spaces", {
        available_spaces: parseInt(newSpaces),
      });
      alert("Updated available spaces!");
      fetchStats();
      setNewSpaces("");
    } catch (err) {
      alert("Failed to update: " + err.response?.data?.error);
    }
  };

  return (
    <motion.div
      initial={{
        x: window.innerWidth < 768 ? -100 : 0,
        y: window.innerWidth >= 768 ? 100 : 0,
        opacity: 0,
      }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container"
    >
      <h2 className="mb-3">Dashboard</h2>
      <p>
        🕒 Current Time: <strong>{currentTime.toLocaleTimeString()}</strong>
      </p>

      {/* 🚧 Update Available Spaces */}
      <form onSubmit={updateSpaces} className="mb-4">
        <label className="form-label">Update Available Spaces:</label>
        <div className="input-group">
          <input
            type="number"
            className="form-control"
            placeholder="e.g. 70"
            value={newSpaces}
            onChange={(e) => setNewSpaces(e.target.value)}
            required
          />
          <button className="btn btn-outline-primary" type="submit">
            Update
          </button>
        </div>
      </form>

      {/* 🔢 Summary Cards */}
      <div className="row mb-4">
        {[
          { label: "Open Spaces", value: stats.openSpaces, bg: "bg-success" },
          { label: "Total Cars", value: stats.totalCars, bg: "bg-primary" },
          {
            label: "Total Earnings (birr)",
            value: stats.totalEarnings,
            bg: "bg-warning",
          },
        ].map((item, idx) => (
          <div className="col-md-4 mb-2" key={idx}>
            <div className={`card text-white ${item.bg}`}>
              <div className="card-body">
                <h5>{item.label}</h5>
                <p>
                  <CountUp end={item.value} duration={1.5} separator="," />
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      (/* 📊 20-Minute Interval Chart */)
      {timeStats.length > 0 && (
        <div className="mb-5">
          <h4>Check-In Trend (Every 20 Minutes)</h4>
          <Line
            data={{
              labels: timeStats.map((d) => d.label),
              datasets: [
                {
                  label: "Check-Ins",
                  data: timeStats.map((d) => d.count),
                  borderColor: "#007bff",
                  backgroundColor: "#007bff33",
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: true },
              },
              scales: {
                x: {
                  title: { display: true, text: "Time of Day" },
                  ticks: { maxRotation: 0 },
                },
                y: {
                  title: { display: true, text: "Check-ins" },
                  beginAtZero: true,
                  ticks: {
                    precision: 0, // Ensure no decimal values
                  },
                },
              },
            }}
          />
        </div>
      )}
      <h4>Currently Parked Cars</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>License Plate</th>
            <th>Phone</th>
            <th>Entry Time</th>
          </tr>
        </thead>
        <tbody>
          {stats.cars.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center">
                No cars parked
              </td>
            </tr>
          ) : (
            stats.cars.map((car) => (
              <tr key={car.id}>
                <td>{car.license_plate}</td>
                <td>{car.phone}</td>
                <td>{new Date(car.entry_time).toLocaleTimeString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </motion.div>
  );
};

export default Dashboard;
