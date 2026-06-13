const API_URL = 'http://localhost:4000';

const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

const productDetailUrl = (id) => `product-detail?id=${encodeURIComponent(id)}`;

const formatPeso = (amount) => `\u20B1${parseFloat(amount || 0).toFixed(2)}`;

const getUser = () => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

const getStatusBadge = (status) => {
    if (status === 'In Stock') return '<span class="badge badge-success">In Stock</span>';
    if (status === 'Low Stock') return '<span class="badge badge-warning">Low Stock</span>';
    return '<span class="badge badge-danger">Out of Stock</span>';
};

const getImageUrl = (path) => {
    if (!path) return 'images/placeholder.svg';
    if (path.startsWith('http') || path.startsWith('uploads/')) return `${API_URL}/${path}`;
    return path;
};

const getAddToCartButton = (product) => {
    if (product.status === 'Out of Stock') {
        return '<button type="button" class="btn btn-sm btn-disabled" disabled><i class="fas fa-cart-plus"></i> Out of Stock</button>';
    }
    return `<button type="button" class="btn btn-primary btn-sm add-cart-btn" data-id="${product.id}"><i class="fas fa-cart-plus"></i> Add to Cart</button>`;
};

const buildProductCard = (product) => {
    const detailUrl = productDetailUrl(product.id);
    const name = escapeHtml(product.name);
    const series = escapeHtml(product.series || '');
    const brand = escapeHtml(product.brand || '');
    const img = escapeHtml(getImageUrl(product.image_url));

    return `
    <div class="product-card">
        <a href="${detailUrl}" class="product-card-link">
            <img src="${img}" alt="${name}" onerror="this.src='images/placeholder.svg'">
        </a>
        <div class="card-body">
            <a href="${detailUrl}" class="product-name-link"><div class="product-name">${name}</div></a>
            <div class="product-card-meta">
                <div class="product-brand">${series}${series && brand ? ' | ' : ''}${brand}</div>
                <div class="product-price">${formatPeso(product.price)}</div>
                <div class="product-stock">${getStatusBadge(product.status)}</div>
            </div>
            <div class="product-actions">
                <a href="${detailUrl}" class="btn btn-secondary btn-sm"><i class="fas fa-eye"></i> View Details</a>
                ${getAddToCartButton(product)}
            </div>
        </div>
    </div>`;
};

const initNavbar = () => {
    $('#navbar').load('header.html', function () {
        const user = getUser();
        if (user) {
            $('#authLinks').hide();
            $('#userLinks').show();
            if (user.role === 'admin') $('#adminLink').show();
            const token = sessionStorage.getItem('token');
            if (token) {
                $.ajax({
                    method: 'GET',
                    url: `${API_URL}/api/v1/cart`,
                    headers: { Authorization: 'Bearer ' + JSON.parse(token) },
                    success: function (data) {
                        const count = data.rows.reduce((s, i) => s + i.quantity, 0);
                        if (count > 0) $('#cartCount').text(count).show();
                    }
                });
            }
        }
        $('#logoutBtn').on('click', function (e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = 'index.html';
        });
    });
};

const addToCart = (productId, event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const token = sessionStorage.getItem('token');
    if (!token) {
        Swal.fire({ icon: 'warning', text: 'Please login to add items to cart.' })
            .then(() => { window.location.href = 'login.html'; });
        return;
    }
    $.ajax({
        method: 'POST',
        url: `${API_URL}/api/v1/cart`,
        headers: { Authorization: 'Bearer ' + JSON.parse(token), 'Content-Type': 'application/json' },
        data: JSON.stringify({ product_id: productId, quantity: 1 }),
        success: function () {
            Swal.fire({ icon: 'success', text: 'Added to cart!', timer: 1500, showConfirmButton: false });
            $.ajax({
                method: 'GET',
                url: `${API_URL}/api/v1/cart`,
                headers: { Authorization: 'Bearer ' + JSON.parse(token) },
                success: function (data) {
                    const count = data.rows.reduce((s, i) => s + i.quantity, 0);
                    $('#cartCount').text(count).show();
                }
            });
        },
        error: function () {
            Swal.fire({ icon: 'error', text: 'Failed to add to cart.' });
        }
    });
};

$(document).on('click', '.add-cart-btn', function (e) {
    addToCart($(this).data('id'), e);
});
