const mongoose = require('mongoose');
const Transaction = require('../models/TransactionModel');
const Inventory = require('../models/InventoryModel');
const ObjectId = mongoose.Types.ObjectId;

Transaction.createIndexes({ createdAt: -1 });

exports.createTransaction = async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        // find the inventory for each item and do what needed
        const items = req.body.items;

        for (const item of items) {
            let fromInventory = await Inventory.findOne({ meatId: item.meatId });

            // here i am shifting the meats with closer expiry date forward
            fromInventory.meats.sort((a, b) => {
                if (a.expiryDate < b.expiryDate) return -1;
                else return 1;
            })

            let quantityNeed = item.quantity;

            for (const meat of fromInventory.meats) {
                if (quantityNeed === 0) {
                    break;
                }
                if (meat.quantityAvailable >= quantityNeed) {
                    meat.quantityAvailable -= quantityNeed;
                    fromInventory.stockLevel -= quantityNeed;
                    quantityNeed = 0;
                }
                else {
                    quantityNeed -= meat.quantityAvailable;
                    fromInventory.stockLevel -= meat.quantityAvailable;
                    meat.quantityAvailable = 0;
                }
            }
            fromInventory.meats = fromInventory.meats.filter((meat) => meat.quantityAvailable > 0);
            await fromInventory.save();
        }

        await transaction.save();
        res.status(201).json({
            status: "success",
            data: {
                transaction
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        let pipeline = [];
        // pipeline.push({ $unwind: "$items" });

        let queryObj = { ...req.query };

        // Handling meatId, outletId, and year independently
        if (queryObj.meatId) {
            pipeline.push({ $match: { "items.meatId": new ObjectId(queryObj.meatId) } });
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
        let transactions = await Transaction.aggregate(pipeline);

        res.status(200).json({
            status: "success",
            items: transactions.length,
            data: {
                transactions
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

exports.getYearlyData = async (req, res) => {
    try {
        let { year, meatId, outletId } = req.query;

        // Construct match stages for year, meatId, and outletId
        const matchStages = [];
        if (year) {
            year = parseInt(year);
            matchStages.push({
                $match: {
                    addedOn: {
                        $gt: new Date(year, 0, 1),
                        $lte: new Date(year + 1, 0, 1)
                    }
                }
            });
        }
        if (meatId) {
            matchStages.push({ $match: { "items.meatId": new ObjectId(meatId) } });
        }
        if (outletId) {
            matchStages.push({ $match: { outletId: new ObjectId(outletId) } });
        }

        const aggResult = await Transaction.aggregate([
            {
                $facet: {
                    monthly: [
                        { $unwind: "$items" },
                        ...matchStages,
                        {
                            $group: {
                                _id: { $month: "$addedOn" },
                                totalQuantity: { $sum: "$items.quantity" },
                                maxTransactionQuantity: { $max: "$items.quantity" },
                                minTransactionQuantity: { $min: "$items.quantity" },
                                totalAmount: { $sum: "$items.price" },
                                minTransactionAmount: { $min: "$items.price" },
                                maxTransactionAmount: { $max: "$items.price" },
                                avgTransactionAmount: { $avg: "$items.price" },
                                avgTransactionQuantity: { $avg: "$items.quantity" },
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    overall: [
                        { $unwind: "$items" },
                        ...matchStages,
                        {
                            $group: {
                                _id: null,
                                totalQuantity: { $sum: "$items.quantity" },
                                maxTransactionQuantity: { $max: "$items.quantity" },
                                minTransactionQuantity: { $min: "$items.quantity" },
                                totalAmount: { $sum: "$items.price" },
                                minTransactionAmount: { $min: "$items.price" },
                                maxTransactionAmount: { $max: "$items.price" },
                                avgTransactionAmount: { $avg: "$items.price" },
                                avgTransactionQuantity: { $avg: "$items.quantity" },
                            }
                        }
                    ]
                }
            }
        ]);

        res.status(200).json({
            status: "success",
            data: {
                aggResult
            }
        })

    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        })
    }
}

exports.getOverAllStats = async (req, res) => {
    try {
        const aggResult = await Transaction.aggregate([
            {
                $facet: {
                    overall: [
                        {
                            $unwind: "$items"
                        },
                        {
                            $group: {
                                _id: null,
                                totalQuantity: { $sum: "$items.quantity" },
                                maxTransactionQuantity: { $max: "$items.quantity" },
                                minTransactionQuantity: { $min: "$items.quantity" },
                                totalAmount: { $sum: "$items.price" },
                                minTransactionAmount: { $min: "$items.price" },
                                maxTransactionAmount: { $max: "$items.price" },
                                avgTransactionAmount: { $avg: "$items.price" },
                                avgTransactionQuantity: { $avg: "$items.quantity" },
                            }
                        }
                    ],
                    byMeatId: [
                        {
                            $unwind: "$items"
                        },
                        {
                            $group: {
                                _id: "$items.meatId",
                                totalQuantity: { $sum: "$items.quantity" },
                                meatMaxTransactionQuantity: { $max: "$items.quantity" },
                                meatMinTransactionQuantity: { $min: "$items.quantity" },
                                meatTotalAmount: { $sum: "$items.price" },
                                meatMinTransactionAmount: { $min: "$items.price" },
                                meatMaxTransactionAmount: { $max: "$items.price" },
                                meatAvgTransactionAmount: { $avg: "$items.price" },
                                meatAvgTransactionQuantity: { $avg: "$items.quantity" },
                            }
                        }
                    ]
                }
            }
        ]);

        res.status(200).json({
            status: "success",
            data: {
                aggResult
            }
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
}

exports.getPopularity = async (req, res) => {
    try {

        const aggResult = await Transaction.aggregate([
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: "$items.meatId",
                    totalTransaction: { $sum: 1 },
                    totalQuantity: { $sum: "$items.quantity" },
                    totalAmount: { $sum: "$items.price" }
                }
            },
            {
                $sort: { totalTransaction: -1 }
            }
        ]);

        res.status(200).json({
            status: "success",
            data: {
                aggResult
            }
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
};

exports.prevComparison = async (req, res) => {
    try {
        const { compare } = req.query;

        let currentDate = new Date();
        let prevDate = new Date(currentDate);

        let currentWeekStartDate = new Date(currentDate);
        let currentWeekEndDate = new Date(currentDate);
        let prevWeekStartDate = new Date(currentDate);
        let prevWeekEndDate = new Date(currentDate);

        if (compare === 'year') {
            prevDate.setFullYear(currentDate.getFullYear() - 1);
        } else if (compare === 'month') {
            prevDate.setMonth(currentDate.getMonth() - 1);
        } else if (compare === 'week') {
            // added +1 to make it start from monday, not sunday
            const currentDayOftheWeek = currentDate.getDay();
            currentWeekStartDate.setDate(currentDate.getDate() - currentDayOftheWeek + 1);

            prevWeekStartDate = new Date(currentWeekStartDate);
            prevWeekStartDate.setDate(currentWeekStartDate.getDate() - 7);

            prevWeekEndDate = new Date(currentWeekStartDate);
            prevWeekEndDate.setDate(currentWeekStartDate.getDate() - 1);

        } else {
            return res.status(400).json({
                status: "error",
                message: "Invalid comparison parameter. Please specify 'year', 'month', or 'week'."
            });
        }

        const currYear = currentDate.getFullYear();
        const prevYear = prevDate.getFullYear();
        const currMonth = currentDate.getMonth() + 1;
        const prevMonth = prevDate.getMonth() + 1;

        const currYearData = await getTransactionData(currYear, currMonth, currentWeekStartDate, currentWeekEndDate, compare);
        const prevYearData = await getTransactionData(prevYear, prevMonth, prevWeekStartDate, prevWeekEndDate, compare);

        let overallPlusMinus = {};

        // if (
        //     currYearData &&
        //     prevYearData &&
        //     currYearData.overall &&
        //     prevYearData.overall &&
        //     currYearData.overall[0] &&
        //     prevYearData.overall[0] &&
        //     prevYearData.overall[0].totalQuantity !== 0 &&
        //     prevYearData.overall[0].totalAmount !== 0 &&
        //     prevYearData.overall[0].avgTransactionAmount !== 0 &&
        //     prevYearData.overall[0].avgTransactionQuantity !== 0
        // ) {
        //     console.log("over here !");
        overallPlusMinus = {
            quantitySold: ((currYearData.overall[0].totalQuantity - prevYearData.overall[0].totalQuantity) / (prevYearData.overall[0].totalQuantity === 0 ? 1 : prevYearData.overall[0].totalQuantity)) * 100,
            amountGenerated: ((currYearData.overall[0].totalAmount - prevYearData.overall[0].totalAmount) / (prevYearData.overall[0].totalAmount === 0 ? 1 : prevYearData.overall[0].totalAmount)) * 100,
            avgTransactionAmount: ((currYearData.overall[0].avgTransactionAmount - prevYearData.overall[0].avgTransactionAmount) / (prevYearData.overall[0].avgTransactionAmount === 0 ? 1 : prevYearData.overall[0].avgTransactionAmount)) * 100,
            avgTransactionQuantity: ((currYearData.overall[0].avgTransactionQuantity - prevYearData.overall[0].avgTransactionQuantity) / (prevYearData.overall[0].avgTransactionQuantity === 0 ? 1 : prevYearData.overall[0].avgTransactionQuantity)) * 100,
        };
        // } else {
        //     overallPlusMinus = {
        //         quantitySold: 0,
        //         amountGenerated: 0,
        //         avgTransactionAmount: 0,
        //         avgTransactionQuantity: 0
        //     };
        // }


        res.status(200).json({
            status: "success",
            data: {
                currentData: currYearData,
                previousData: prevYearData,
                overallPlusMinus
            }
        });

    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
};

async function getTransactionData(year, month, weekStart, weekEnd, compare) {
    let matchQuery = {};

    if (compare === 'year') {
        matchQuery = {
            addedOn: {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`)
            }
        };
    } else if (compare === 'month') {
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        matchQuery = {
            addedOn: {
                $gte: new Date(`${year}-${month}-01`),
                $lte: new Date(`${year}-${month}-${lastDayOfMonth}`)
            }
        };
    } else if (compare === 'week') {
        matchQuery = {
            addedOn: {
                $gte: weekStart,
                $lte: weekEnd
            }
        };
    }

    // Aggregate transaction data based on the match query
    const data = await Transaction.aggregate([
        {
            $match: matchQuery
        },
        {
            $facet: {
                overall: [
                    {
                        $unwind: "$items"
                    },
                    {
                        $group: {
                            _id: null,
                            totalQuantity: { $sum: "$items.quantity" },
                            maxTransactionQuantity: { $max: "$items.quantity" },
                            minTransactionQuantity: { $min: "$items.quantity" },
                            totalAmount: { $sum: "$items.price" },
                            minTransactionAmount: { $min: "$items.price" },
                            maxTransactionAmount: { $max: "$items.price" },
                            avgTransactionAmount: { $avg: "$items.price" },
                            avgTransactionQuantity: { $avg: "$items.quantity" },
                        }
                    }
                ],
                byMeatId: [
                    {
                        $unwind: "$items"
                    },
                    {
                        $group: {
                            _id: "$items.meatId",
                            totalQuantity: { $sum: "$items.quantity" },
                            meatMaxTransactionQuantity: { $max: "$items.quantity" },
                            meatMinTransactionQuantity: { $min: "$items.quantity" },
                            meatTotalAmount: { $sum: "$items.price" },
                            meatMinTransactionAmount: { $min: "$items.price" },
                            meatMaxTransactionAmount: { $max: "$items.price" },
                            meatAvgTransactionAmount: { $avg: "$items.price" },
                            meatAvgTransactionQuantity: { $avg: "$items.quantity" },
                        }
                    }
                ]
            }
        }
    ]);


    if (data[0].overall.length === 0) {
        data[0].overall.push({
            totalQuantity: 0,
            maxTransactionQuantity: 0,
            minTransactionQuantity: 0,
            totalAmount: 0,
            minTransactionAmount: 0,
            maxTransactionAmount: 0,
            avgTransactionAmount: 0,
            avgTransactionQuantity: 0,
        })
    }

    return data[0];
}

// exports.getBusiestMonth;