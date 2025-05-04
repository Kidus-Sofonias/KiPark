const db = require("../models/db");
const twilio = require("twilio");

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const FROM_PHONE = process.env.TWILIO_PHONE;

// Generate a 6-digit PIN
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check in a car
exports.checkIn = async (req, res) => {
  let { licensePlate, phone } = req.body;
  const parkerId = req.user?.id;
  const entryTime = new Date();
  const pin = generatePin();

  // Format to E.164 if local number
  if (phone.startsWith("0")) {
    phone = "+251" + phone.slice(1);
  }

  try {
    await db.execute(
      "INSERT INTO parking_records (license_plate, phone, entry_time, pin, status, parker_id) VALUES (?, ?, ?, ?, ?, ?)",
      [licensePlate, phone, entryTime, pin, "parked", parkerId]
    );

    await twilioClient.messages.create({
      body: `Welcome to Kipark. Your check-in PIN is: ${pin}`,
      from: FROM_PHONE,
      to: phone,
    });

    res.status(201).json({ message: "Check-in successful" });
  } catch (err) {
    res.status(500).json({ error: "Check-in failed", details: err.message });
  }
};

// Check out a car
exports.checkOut = async (req, res) => {
  let { pin, phone } = req.body;

  // Format phone to international if needed
  if (phone?.startsWith("0")) {
    phone = "+251" + phone.slice(1);
  }

  const exitTime = new Date();
  const rate = 20; // birr per hour

  try {
    let query = "";
    let param = "";

    if (pin) {
      query =
        'SELECT * FROM parking_records WHERE pin = ? AND status = "parked"';
      param = pin;
    } else if (phone) {
      query =
        'SELECT * FROM parking_records WHERE phone = ? AND status = "parked" ORDER BY entry_time DESC LIMIT 1';
      param = phone;
    } else {
      return res.status(400).json({ error: "PIN or phone number is required" });
    }

    const [rows] = await db.execute(query, [param]);
    if (rows.length === 0)
      return res.status(404).json({ error: "No active parked car found" });

    const record = rows[0];
    const entryTime = new Date(record.entry_time);
    const hours = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
    const cost = hours * rate;

    await db.execute(
      'UPDATE parking_records SET exit_time = ?, cost = ?, status = "exited" WHERE id = ?',
      [exitTime, cost, record.id]
    );

    await twilioClient.messages.create({
      body: `Checkout Complete. Entry: ${entryTime.toLocaleString()}, Exit: ${exitTime.toLocaleString()}, Cost: ${cost} birr`,
      from: FROM_PHONE,
      to: record.phone,
    });

    res.json({
      message: "Checkout complete",
      licensePlate: record.license_plate,
      phone: record.phone,
      entryTime,
      exitTime,
      cost,
    });
  } catch (err) {
    res.status(500).json({ error: "Checkout failed", details: err.message });
  }
};

// Get dashboard stats
exports.getStats = async (req, res) => {
  const parkerId = req.user.id;

  try {
    const [parked] = await db.execute(
      'SELECT * FROM parking_records WHERE parker_id = ? AND status = "parked"',
      [parkerId]
    );

    const [exited] = await db.execute(
      'SELECT * FROM parking_records WHERE parker_id = ? AND status = "exited" AND DATE(exit_time) = CURDATE()',
      [parkerId]
    );

    const totalEarnings = exited.reduce(
      (sum, car) => sum + Number(car.cost),
      0
    );
    const totalCars = parked.length + exited.length;
    const [userRow] = await db.execute(
      "SELECT available_spaces FROM users WHERE id = ?",
      [parkerId]
    );
    const maxSpots = userRow[0]?.available_spaces || 50;


    res.json({
      openSpaces: maxSpots - parked.length,
      checkedIn: parked.length,
      checkedOut: exited.length,
      totalCars,
      totalEarnings,
      cars: parked,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to load dashboard", details: err.message });
  }
};
// Update available spaces
exports.updateSpaces = async (req, res) => {
  const parkerId = req.user.id;
  const { available_spaces } = req.body;

  if (!available_spaces || isNaN(available_spaces) || available_spaces < 0) {
    return res.status(400).json({ error: "Invalid number of spaces" });
  }

  try {
    await db.execute("UPDATE users SET available_spaces = ? WHERE id = ?", [
      available_spaces,
      parkerId,
    ]);
    res.json({ message: "Available spaces updated successfully" });
  } catch (err) {
    console.error("❌ Failed to update spaces:", err.message);
    res.status(500).json({ error: "Server error updating spaces" });
  }
};
