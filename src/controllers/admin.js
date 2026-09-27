export function adminDashboard(req, res) {
    return res.render('admin', {
        title: 'Admin Dashboard'
    });
}