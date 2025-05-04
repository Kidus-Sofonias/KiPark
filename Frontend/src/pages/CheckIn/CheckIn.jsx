import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const CheckIn = () => {
  const [form, setForm] = useState({
    licensePlate: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/parking/checkin", form);
      alert("Check-in successful! PIN sent via SMS.");
      navigate("/dashboard");
    } catch (err) {
      alert("Check-in failed: " + err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container col-md-6">
      <h2 className="mb-4">Car Check-In</h2>
      <form onSubmit={handleCheckIn}>
        <div className="mb-3">
          <label className="form-label">License Plate</label>
          <input
            type="text"
            name="licensePlate"
            className="form-control"
            value={form.licensePlate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Driver Phone Number</label>
          <input
            type="text"
            name="phone"
            className="form-control"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>
        <button className="btn btn-success" disabled={loading}>
          {loading ? "Generating..." : "Generate & Send PIN"}
        </button>
      </form>
    </div>
  );
};

export default CheckIn;
