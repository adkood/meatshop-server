const Outlet = require('../models/OutletModel');

exports.createOutlet = async (req, res) => {
    try {
        const outlet = new Outlet(req.body);
        await outlet.save();
        res.status(201).json({
            status: "success",
            data: {
                outlet
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

exports.getOutlets = async (req, res) => {
    try {
        const outlets = await Outlet.find();
        res.status(200).json({
            status: "success",
            data: {
                outlets
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};