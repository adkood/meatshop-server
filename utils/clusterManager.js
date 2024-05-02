const cluster = require('cluster');
const os = require('os');

const MAX_RESTARTS = 5;

function startCluster(appCallback) {
    if (cluster.isPrimary) {
        const numCPUs = os.cpus().length;
        for (let i = 0; i < numCPUs; i++) {
            createWorker();
        }
        cluster.on('exit', (worker, code, signal) => {
            if (worker.restarts < MAX_RESTARTS) {
                console.log(`Worker ${worker.process.pid} died. Restarting...`);
                createWorker();
            } else {
                console.log(`Worker ${worker.process.pid} reached maximum restart limit. Not restarting.`);
            }
        });
    } else {
        appCallback();
    }
}

function createWorker() {
    const worker = cluster.fork();
    worker.restarts = 0;
    worker.on('exit', (code, signal) => {
        worker.restarts++;
    });
}

module.exports = startCluster;
