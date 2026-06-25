window.API_URL = window.API_URL || 'http://localhost:4000';
var API_URL = window.API_URL;

const renderStars = (rating, includeColors = false) => {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        const starClass = i <= rating ? 'fas fa-star' : 'far fa-star';
        const colorClass = includeColors ? (i <= rating ? ' text-warning' : ' text-secondary') : '';
        stars += `<i class="${starClass}${colorClass}"></i>`;
    }
    return stars;
};

const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

const formatPeso = (amount) => `\u20B1${parseFloat(amount || 0).toFixed(2)}`;

const productDetailUrl = (id) => `product-detail.html?id=${encodeURIComponent(id)}`;

const getStatusBadge = (status) => {
    if (status === 'In Stock') return '<span class="badge badge-success">In Stock</span>';
    if (status === 'Low Stock') return '<span class="badge badge-warning">Low Stock</span>';
    return '<span class="badge badge-danger">Out of Stock</span>';
};

const getImageUrl = (path) => {
    if (!path) return 'images/placeholder.svg';
    if (path.startsWith('http') || path.startsWith('uploads/')) return `${window.API_URL}/${path}`;
    return path;
};

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
        console.log('initNavbar - user:', user);
        if (user) {
            $('#authLinks').hide();
            $('#userLinks').show();
            if (user.avatar) {
                const avatarUrl = window.API_URL + '/' + user.avatar;
                console.log('Setting avatar URL:', avatarUrl);
                $('#userAvatar').attr('src', avatarUrl);
            }
            if (user.role === 'admin') $('#adminLink').show();
            updateCartBadge(prefix);
        }
        $('#logoutBtn').on('click', function (e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = prefix + 'index.html';
        });

        // Handle user dropdown toggle
        $('#userDropdownToggle').on('click', function(e) {
            e.stopPropagation();
            const $menu = $('#userDropdownMenu');
            $menu.toggleClass('show');
        });

        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#userDropdown').length) {
                $('#userDropdownMenu').removeClass('show');
            }
        });
    });
    // Load footer
    $('#footer').load(prefix + 'footer.html');
};

const updateCartBadge = (basePath) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    $.ajax({
        method: 'GET',
        url: `${window.API_URL}/api/v1/cart`,
        headers: { Authorization: 'Bearer ' + JSON.parse(token) },
        success: function (data) {
            const count = data.rows.reduce((sum, item) => sum + item.quantity, 0);
            if (count > 0) {
                $('#cartCount').text(count).show();
            }
        }
    });
};
