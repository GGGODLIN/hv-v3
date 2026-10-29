import './../scripts/rc12m-fullrun';
process.on('exit', () => console.error('EPD', process.env.SC, JSON.stringify((globalThis as any).EPD)));
