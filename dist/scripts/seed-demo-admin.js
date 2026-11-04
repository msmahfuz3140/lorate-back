"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../database/connection");
const initAdmin_1 = require("../database/initAdmin");
async function run() {
    console.log('Connecting to database...');
    await connection_1.db.connect();
    console.log('Initializing authoritative admin in MongoDB...');
    await (0, initAdmin_1.initializeAuthoritativeAdmin)();
    console.log('Done!');
    await connection_1.db.disconnect();
}
run()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error('Failed to initialize admin:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-demo-admin.js.map