

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
    const hasStats = product.average_rating != null || product.sold_count > 0;

    return `
    <div class="product-card">
        <a href="${detailUrl}" class="product-card-link">
            <div class="product-card-image-wrap">
                <img src="${img}" alt="${name}" onerror="this.src='images/placeholder.svg'">
                <div class="product-stock-overlay">${getStatusBadge(product.status)}</div>
            </div>
        </a>
        <div class="card-body">
            <a href="${detailUrl}" class="product-name-link"><div class="product-name">${name}</div></a>
            <div class="product-card-meta">
                <div class="product-brand">${series}${series && brand ? ' | ' : ''}${brand}</div>
                <div class="product-price">${formatPeso(product.price)}</div>
            </div>
            ${hasStats ? `
            <div class="product-stats mt-1 mb-1" style="font-size: 13px;">
                ${product.average_rating != null ? `
                    <span class="mr-2">${renderStars(Math.round(product.average_rating), true)} ${product.average_rating.toFixed(1)}</span>
                ` : ''}
                ${product.sold_count > 0 ? `<span class="text-muted">${product.sold_count} sold</span>` : ''}
            </div>
            ` : ''}
            <div class="product-actions">
                <a href="${detailUrl}" class="btn btn-secondary btn-sm"><i class="fas fa-eye"></i> View Details</a>
                ${getAddToCartButton(product)}
            </div>
        </div>
    </div>`;
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
        url: `${window.API_URL}/api/v1/cart`,
        headers: { Authorization: 'Bearer ' + JSON.parse(token), 'Content-Type': 'application/json' },
        data: JSON.stringify({ product_id: productId, quantity: 1 }),
        success: function () {
            Swal.fire({ icon: 'success', text: 'Added to cart!', timer: 1500, showConfirmButton: false });
            $.ajax({
                method: 'GET',
                url: `${window.API_URL}/api/v1/cart`,
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
