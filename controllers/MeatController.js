const Meat = require('../models/MeatModel');
const redisClient = require('../utils/redisConfig');

exports.createMeat = async (req, res) => {
    try {
        const meat = new Meat(req.body);
        await meat.save();

        redisClient.del(`meats`, (err) => {
            if (err) {
                console.error("Error deleting data from Redis:", err);
            }
        });

        res.status(201).json({
            status: "success",
            data: {
                meat
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

exports.getMeats = async (req, res) => {
    try {
        redisClient.get(`meats`, async (err, cache) => {

            if (err) {
                console.error("Error setting data in Redis:", err);
            }

            if (cache) {
                return res.status(200).json({
                    status: "success",
                    data: {
                        meats: JSON.parse(cache)
                    }
                });
            }

            const meats = await Meat.find();

            redisClient.setex(`meats`, 3600, JSON.stringify(meats), (err) => {
                if (err) {
                    console.error("Error setting data in Redis:", err);
                }

                res.status(200).json({
                    status: "success",
                    items: meats.length,
                    data: {
                        meats
                    }
                });

            })
        })
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};
