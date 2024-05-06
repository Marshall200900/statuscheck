import cron from 'node-cron';

export const startScheduler = (cb) => {
    cron.schedule('00 19 * * *', cb);
    // cron.schedule('* * * * *', cb);
}
