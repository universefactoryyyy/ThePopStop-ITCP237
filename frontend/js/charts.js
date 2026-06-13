const API_URL = 'http://localhost:4000';

let dashboardData = null;
let barChartInstance = null;
let lineChartInstance = null;
let pieChartInstance = null;

const pinkColors = ['#e8447a', '#ff5c8a', '#ff85aa', '#ffb3cc', '#ffe0ec', '#3d2035', '#7a4060'];

const compactChartOptions = (type) => {
    const options = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: type === 'pie' ? 1.1 : 2.2,
        plugins: {
            legend: {
                labels: { boxWidth: 12, font: { size: 11 } }
            }
        }
    };
    if (type !== 'pie') {
        options.scales = {
            y: { beginAtZero: true, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 }, maxRotation: 45 } }
        };
    }
    return options;
};

const getOrdersByDay = (orders, days) => {
    const labels = [];
    const values = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const dayTotal = orders.filter(o => o.createdAt.startsWith(key)).length;
        values.push(dayTotal);
    }
    return { labels, values };
};

const getRevenueByMonth = (orders) => {
    const months = {};
    orders.forEach(o => {
        const d = new Date(o.createdAt);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        months[key] = (months[key] || 0) + parseFloat(o.total_amount);
    });
    return { labels: Object.keys(months), values: Object.values(months) };
};

const getBrandSales = (brandSales) => {
    const brands = {};
    brandSales.forEach(item => {
        const brand = item.Product ? item.Product.brand : 'Unknown';
        brands[brand] = (brands[brand] || 0) + (item.quantity * parseFloat(item.unit_price));
    });
    return { labels: Object.keys(brands), values: Object.values(brands) };
};

const renderDashboardCharts = (data) => {
    dashboardData = data;
    const dayData = getOrdersByDay(data.orders, 7);
    const monthData = getRevenueByMonth(data.orders);
    const brandData = getBrandSales(data.brandSales);

    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: dayData.labels,
            datasets: [{ label: 'Orders', data: dayData.values, backgroundColor: pinkColors }]
        },
        options: compactChartOptions('bar')
    });

    if (lineChartInstance) lineChartInstance.destroy();
    lineChartInstance = new Chart(document.getElementById('lineChart'), {
        type: 'line',
        data: {
            labels: monthData.labels,
            datasets: [{ label: 'Revenue (₱)', data: monthData.values, borderColor: '#e8447a', backgroundColor: 'rgba(232,68,122,0.1)', fill: true }]
        },
        options: compactChartOptions('line')
    });

    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(document.getElementById('pieChart'), {
        type: 'pie',
        data: {
            labels: brandData.labels,
            datasets: [{ data: brandData.values, backgroundColor: pinkColors }]
        },
        options: compactChartOptions('pie')
    });
};

const renderReportsCharts = (data, startDate, endDate) => {
    let orders = data.orders;
    if (startDate && endDate) {
        orders = orders.filter(o => {
            const d = o.createdAt.split('T')[0];
            return d >= startDate && d <= endDate;
        });
    }

    const dayLabels = orders.map(o => new Date(o.createdAt).toLocaleDateString());
    const dayValues = orders.map(o => parseFloat(o.total_amount));
    const monthData = getRevenueByMonth(orders);
    const brandData = getBrandSales(data.brandSales);

    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(document.getElementById('reportBarChart'), {
        type: 'bar',
        data: {
            labels: dayLabels.length ? dayLabels : ['No data'],
            datasets: [{ label: 'Sales (₱)', data: dayValues.length ? dayValues : [0], backgroundColor: pinkColors }]
        },
        options: compactChartOptions('bar')
    });

    if (lineChartInstance) lineChartInstance.destroy();
    lineChartInstance = new Chart(document.getElementById('reportLineChart'), {
        type: 'line',
        data: {
            labels: monthData.labels.length ? monthData.labels : ['No data'],
            datasets: [{ label: 'Monthly Revenue', data: monthData.values.length ? monthData.values : [0], borderColor: '#e8447a', fill: true }]
        },
        options: compactChartOptions('line')
    });

    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(document.getElementById('reportPieChart'), {
        type: 'pie',
        data: {
            labels: brandData.labels.length ? brandData.labels : ['No data'],
            datasets: [{ data: brandData.values.length ? brandData.values : [0], backgroundColor: pinkColors }]
        },
        options: compactChartOptions('pie')
    });
};

$(document).ready(function () {
    if ($('#reportBarChart').length) {
        const token = JSON.parse(sessionStorage.getItem('token'));
        $.ajax({
            method: 'GET',
            url: `${API_URL}/api/v1/dashboard`,
            headers: { Authorization: 'Bearer ' + token },
            success: function (data) {
                dashboardData = data;
                renderReportsCharts(data);
            }
        });

        $('#filterReports').on('click', function () {
            if (dashboardData) {
                renderReportsCharts(dashboardData, $('#startDate').val(), $('#endDate').val());
            }
        });
    }
});
