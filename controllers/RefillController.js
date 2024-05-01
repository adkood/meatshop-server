const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Refill = require('../models/RefillModel');

exports.getRefills = async (req, res) => {

    try {
        let pipeline = [];

        let queryObj = { ...req.query };

        // Handling meatId, outletId, and year independently
        if (queryObj.meatId) {
            pipeline.push({ $match: { meatId: new ObjectId(queryObj.meatId) } });
        }
        if (queryObj.outletId) {
            pipeline.push({ $match: { outletId: new ObjectId(queryObj.outletId) } });
        }
        if (queryObj.year) {
            let year = parseInt(queryObj.year);
            pipeline.push({
                $match: {
                    addedOn: {
                        $gt: new Date(year, 0, 1),
                        $lte: new Date(year + 1, 0, 1)
                    }
                }
            });
        }

        const removeKeys = ['meatId', 'outletId', 'year', 'sort', 'fields', 'page', 'limit'];
        removeKeys.forEach((ele) => delete queryObj[ele]);
        pipeline.push({ $match: queryObj });

        // Sorting stage
        let sortStage = {};
        if (req.query.sort) {
            let sortKeys = req.query.sort.split(',');
            sortKeys.forEach((key) => {
                let [field, direction] = key.split(':');
                sortStage[field] = direction === 'desc' ? -1 : 1;
            });
        } else {
            sortStage.createdAt = -1;
        }
        pipeline.push({ $sort: sortStage });

        // Fields projection stage
        if (req.query.fields) {
            let fieldsKeys = req.query.fields.split(',').reduce((acc, field) => {
                acc[field] = 1;
                return acc;
            }, {});
            console.log(fieldsKeys);
            pipeline.push({ $project: fieldsKeys });
        }

        // Pagination stage
        if (req.query.page) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            pipeline.push({ $skip: skip }, { $limit: limit });
        }

        // Execute aggregation pipeline
        let refills = await Refill.aggregate(pipeline);

        res.status(200).json({
            status: "success",
            items: refills.length,
            data: {
                refills
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};


