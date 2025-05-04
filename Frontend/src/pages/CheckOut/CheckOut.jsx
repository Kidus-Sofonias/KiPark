import React, { useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const CheckOut = () => {
  const [input, setInput] = useState({ pin: "", phone: "" });
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInput = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/parking/checkout", input);
      setCar(res.data);
    } catch (err) {
      alert("Check-out failed: " + err.response?.data?.error);
      setCar(null);
    } finally {
      setLoading(false);
    }
  };

  const confirmLeave = () => {
    alert("Checkout complete. Please collect payment.");
    navigate("/dashboard");
  };

  return (
    <div className="container col-md-6">
      <h2 className="mb-4">Car Check-Out</h2>
      <form onSubmit={handleSearch}>
        <div className="mb-3">
          <label className="form-label">PIN (or)</label>
          <input
            type="text"
            name="pin"
            className="form-control"
            value={input.pin}
            onChange={handleInput}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone Number</label>
          <input
            type="text"
            name="phone"
            className="form-control"
            value={input.phone}
            onChange={handleInput}
          />
        </div>
        <button className="btn btn-warning" disabled={loading}>
          {loading ? "Checking..." : "Check Out"}
        </button>
      </form>

      {car && (
        <div className="mt-4">
          <h4>Check-Out Details</h4>
          <ul className="list-group">
            <li className="list-group-item">
              <strong>License Plate:</strong> {car.licensePlate}
            </li>
            <li className="list-group-item">
              <strong>Phone:</strong> {car.phone}
            </li>
            <li className="list-group-item">
              <strong>Entry Time:</strong>{" "}
              {new Date(car.entryTime).toLocaleString()}
            </li>
            <li className="list-group-item">
              <strong>Exit Time:</strong>{" "}
              {new Date(car.exitTime).toLocaleString()}
            </li>
            <li className="list-group-item">
              <strong>Total Cost:</strong> {car.cost} birr
            </li>
          </ul>
          <button className="btn btn-success mt-3" onClick={confirmLeave}>
            Mark as Left
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckOut;
