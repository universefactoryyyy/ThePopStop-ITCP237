const API_URL = 'http://localhost:4000';

const getToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(token);
};

const checkAdmin = () => {
    const user = sessionStorage.getItem('user');
    if (!user) { window.location.href = '../index.html'; return false; }
    const u = JSON.parse(user);
    if (u.role !== 'admin') { window.location.href = '../index.html'; return false; }
    return true;
};

const initAdminSidebar = (activePage) => {
    $(`.sidebar-nav a[data-page="${activePage}"]`).addClass('active');
};

const loadDashboardStats = () => {
    const token = getToken();
    if (!token) return;

    $.ajax({
        method: 'GET',
        url: `${API_URL}/api/v1/dashboard`,
        headers: { Authorization: 'Bearer ' + token },
        success: function (data) {
            $('#statProducts').text(data.stats.totalProducts);
            $('#statUsers').text(data.stats.totalUsers);
            $('#statOrders').text(data.stats.totalOrders);
            $('#statRevenue').text('₱' + parseFloat(data.stats.totalRevenue).toFixed(2));

            if (typeof renderDashboardCharts === 'function') {
                renderDashboardCharts(data);
            }
        }
    });
};

$(document).ready(function () {
    if ($('#adminDashboard').length && checkAdmin()) {
        initAdminSidebar('dashboard');
        loadDashboardStats();
    }
});
