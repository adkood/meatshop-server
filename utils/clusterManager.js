const cluster = require('cluster');
const os = require('os');

function startCluster(appCallback) {
    if (cluster.isPrimary) {
        const numCPUs = os.cpus().length;
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }
    } else {
        appCallback();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
}

module.exports = startCluster;
