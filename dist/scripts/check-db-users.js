"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const admin_service_1 = require("../services/admin.service");
async function check() {
    try {
        await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        console.log('--- 1. Testing getUsers({}) ---');
        const res1 = await admin_service_1.adminService.getUsers({});
        console.log('res1 total:', res1.total, 'users count:', res1.users.length);
        console.log('res1 users:', res1.users.map(u => ({ id: u.id, email: u.email, role: u.role })));
        console.log('--- 2. Testing getUsers({ role: "SUPER_ADMIN" }) ---');
        const res2 = await admin_service_1.adminService.getUsers({ role: 'SUPER_ADMIN' });
        console.log('res2 total:', res2.total, 'users count:', res2.users.length);
        console.log('--- 3. Testing getDashboardMetrics() ---');
        const res3 = await admin_service_1.adminService.getDashboardMetrics();
        console.log('Dashboard totalRegisteredUsers:', res3.totalRegisteredUsers);
        console.log('--- 4. Testing getUsers with empty strings: { search: undefined, accountStatus: undefined, role: undefined } ---');
        const res4 = await admin_service_1.adminService.getUsers({
            search: undefined,
            accountStatus: undefined,
            role: undefined,
            subscriptionStatus: undefined
        });
        console.log('res4 total:', res4.total, 'users count:', res4.users.length);
    }
    catch (err) {
        console.error('Error:', err);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
}
check();
//# sourceMappingURL=check-db-users.js.map