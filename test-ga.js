fetch('http://localhost:3000/api/admin/analytics/meta', {
    headers: { Authorization: 'Bearer myAdminDashboardSecret456' }
}).then(async r => console.log(await r.text())).catch(console.error);
