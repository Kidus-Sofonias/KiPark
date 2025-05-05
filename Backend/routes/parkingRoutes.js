const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parkingController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/checkin", verifyToken, parkingController.checkIn);
router.post("/checkout", verifyToken, parkingController.checkOut);
router.get("/stats", verifyToken, parkingController.getStats);
router.put("/update-spaces", verifyToken, parkingController.updateSpaces);
router.get("/time-checkins", verifyToken, parkingController.getTimeBasedStats);


module.exports = router;
