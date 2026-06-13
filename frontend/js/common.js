const API_URL = 'http://localhost:4000';

const getToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        Swal.fire({ icon: 'warning', text: 'You must be logged in.', showConfirmButton: true })
            .then(() => window.location.href = 'login.html');
        return null;
    }
    return JSON.parse(token);
};

const getUser = () => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

const initNavbar = (basePath) => {
    const prefix = basePath || '';
    $('#navbar').load(prefix + 'header.html', function () {
        const user = getUser();
        if (user) {
            $('#authLinks').hide();
            $('#userLinks').show();
            if (user.role === 'admin') $('#adminLink').show();
            updateCartBadge(prefix);
        }
        $('#logoutBtn').on('click', function (e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = prefix + 'index.html';
        });
    });
};

const updateCartBadge = (basePath) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    $.ajax({
        method: 'GET',
        url: `${API_URL}/api/v1/cart`,
        headers: { Authorization: 'Bearer ' + JSON.parse(token) },
        success: function (data) {
            const count = data.rows.reduce((sum, item) => sum + item.quantity, 0);
            if (count > 0) {
                $('#cartCount').text(count).show();
            }
        }
    });
};
