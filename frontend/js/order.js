const getToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        Swal.fire({ icon: 'warning', text: 'You must be logged in.', showConfirmButton: true })
            .then(() => window.location.href = 'login.html');
        return null;
    }
    return JSON.parse(token);
};

const formatPesoDiscount = (amount) => `-\u20B1${parseFloat(amount || 0).toFixed(2)}`;

let cartItems = [];
let checkoutCartIds = [];
let orderSubtotal = 0;
let appliedDiscount = null;

const getCheckoutCartIds = () => {
    try {
        const stored = sessionStorage.getItem('checkoutCartIds');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const updateOrderTotals = () => {
    orderSubtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.Product.price) * item.quantity, 0);
    const discountAmount = appliedDiscount ? parseFloat(appliedDiscount.discount_amount) : 0;
    const total = orderSubtotal - discountAmount;

    $('#orderSubtotal').text(formatPeso(orderSubtotal));
    if (appliedDiscount) {
        $('#discountRow').show();
        $('#orderDiscount').text(formatPesoDiscount(discountAmount));
        $('#discountMessage').text(`${appliedDiscount.code} applied: ${appliedDiscount.description || 'Discount'}`).show();
    } else {
        $('#discountRow').hide();
        $('#discountMessage').hide().text('');
    }
    $('#orderTotal').text(formatPeso(total));
};

const loadApplicableDiscounts = () => {
    const token = getToken();
    if (!token || !orderSubtotal) return;

    $.ajax({
        method: 'GET',
        url: `${API_URL}/api/v1/discounts/applicable?subtotal=${orderSubtotal}`,
        headers: { Authorization: 'Bearer ' + token },
        success: function (data) {
            let opts = '<option value="">No discount</option>';
            (data.rows || []).forEach(d => {
                const savings = formatPeso(d.discount_amount);
                opts += `<option value="${d.code}">${d.code} - ${d.description || 'Promo'} (save ${savings})</option>`;
            });
            $('#discountSelect').html(opts);
            if (appliedDiscount) {
                $('#discountSelect').val(appliedDiscount.code);
            }
        }
    });
};

const loadShippingProfile = () => {
    const token = getToken();
    if (!token) return;

    $.ajax({
        method: 'GET',
        url: `${API_URL}/api/v1/profile`,
        headers: { Authorization: 'Bearer ' + token },
        success: function (data) {
            if (!data.customer) return;
            const { phone, addressline } = data.customer;
            if (phone && !$('#shippingPhone').val().trim()) {
                $('#shippingPhone').val(phone);
            }
            if (addressline && !$('#shippingAddress').val().trim()) {
                $('#shippingAddress').val(addressline);
            }
        }
    });
};

const loadCartSummary = () => {
    const token = getToken();
    if (!token) return;

    checkoutCartIds = getCheckoutCartIds();
    if (!checkoutCartIds.length) {
        Swal.fire({ icon: 'info', text: 'Select items from your cart to checkout.' })
            .then(() => { window.location.href = 'cart.html'; });
        return;
    }

    $.ajax({
        method: 'GET',
        url: `${window.API_URL}/api/v1/cart`,
        headers: { Authorization: 'Bearer ' + token },
        success: function (data) {
            const allItems = data.rows || [];
            cartItems = allItems.filter(item => checkoutCartIds.includes(item.id));

            if (!cartItems.length) {
                sessionStorage.removeItem('checkoutCartIds');
                Swal.fire({ icon: 'warning', text: 'Selected items are no longer in your cart.' })
                    .then(() => { window.location.href = 'cart.html'; });
                return;
            }

            let html = '';
            cartItems.forEach(item => {
                const p = item.Product;
                const subtotal = parseFloat(p.price) * item.quantity;
                html += `<div class="checkout-cart-item d-flex justify-content-between mb-2">
                    <span class="checkout-cart-product-name">${p.name} x${item.quantity}</span>
                    <span class="checkout-cart-subtotal text-nowrap">${formatPeso(subtotal)}</span>
                </div>`;
            });
            $('#cartSummary').html(html);
            appliedDiscount = null;
            $('#discountSelect').val('');
            updateOrderTotals();
            loadApplicableDiscounts();
        }
    });
};

const removePurchasedCartItems = (token, ids, onComplete) => {
    if (!ids.length) {
        onComplete();
        return;
    }
    let remaining = ids.length;
    ids.forEach(id => {
        $.ajax({
            method: 'DELETE',
            url: `${API_URL}/api/v1/cart/${id}`,
            headers: { Authorization: 'Bearer ' + token },
            complete: function () {
                remaining -= 1;
                if (remaining === 0) onComplete();
            }
        });
    });
};

$(document).ready(function () {
    if (!$('#checkoutForm').length) return;

    $('#navbar').load('header.html', function () {
        $('#authLinks').hide();
        $('#userLinks').show();
        const user = getUser();
        if (user && user.role === 'admin') $('#adminLink').show();
        $('#logoutBtn').on('click', function (e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = 'index.html';
        });
    });

    loadCartSummary();
    loadShippingProfile();

    $('#applyDiscountBtn').on('click', function () {
        const token = getToken();
        if (!token) return;
        const code = $('#discountSelect').val();
        if (!code) {
            appliedDiscount = null;
            updateOrderTotals();
            return;
        }
        if (!cartItems.length) {
            Swal.fire({ icon: 'error', text: 'Your cart is empty.' });
            return;
        }
        $.ajax({
            method: 'POST',
            url: `${API_URL}/api/v1/discounts/validate`,
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: JSON.stringify({ code, subtotal: orderSubtotal }),
            success: function (data) {
                appliedDiscount = data;
                updateOrderTotals();
                Swal.fire({ icon: 'success', text: 'Discount applied!', timer: 1200, showConfirmButton: false });
            },
            error: function (xhr) {
                appliedDiscount = null;
                $('#discountSelect').val('');
                updateOrderTotals();
                Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Invalid discount code.' });
            }
        });
    });

    $('#discountSelect').on('change', function () {
        if (!$(this).val()) {
            appliedDiscount = null;
            updateOrderTotals();
        }
    });

    $('#checkoutForm').on('submit', function (e) {
        e.preventDefault();
        const token = getToken();
        if (!token) return;

        const shippingPhone = $('#shippingPhone').val().trim();
        const shipping_address = $('#shippingAddress').val().trim();
        const payment_method = $('#paymentMethod').val();
        let valid = true;

        if (!shippingPhone) {
            $('#phoneError').show();
            valid = false;
        } else {
            $('#phoneError').hide();
        }
        if (!shipping_address) {
            $('#addressError').show();
            valid = false;
        } else {
            $('#addressError').hide();
        }
        if (!payment_method) {
            $('#paymentError').show();
            valid = false;
        } else {
            $('#paymentError').hide();
        }
        if (!cartItems.length) {
            Swal.fire({ icon: 'error', text: 'No items selected for checkout.' });
            return;
        }
        if (!valid) return;

        const cart = cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
        }));
        const purchasedCartIds = cartItems.map(item => item.id);

        $.ajax({
            method: 'POST',
            url: `${API_URL}/api/v1/orders`,
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: JSON.stringify({
                cart,
                shipping_address: `Phone: ${shippingPhone}\n${shipping_address}`,
                payment_method,
                discount_code: appliedDiscount ? appliedDiscount.code : null
            }),
            success: function () {
                sessionStorage.removeItem('checkoutCartIds');
                removePurchasedCartItems(token, purchasedCartIds, function () {
                    Swal.fire({ icon: 'success', text: 'Order placed successfully!' })
                        .then(() => { window.location.href = 'orders.html'; });
                });
            },
            error: function (xhr) {
                Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Failed to place order.' });
            }
        });
    });
});

// My Orders page — infinite scroll
if ($('#ordersContainer').length) {
    const BATCH_SIZE = 5;
    let allOrders = [];
    let displayedCount = 0;
    let loading = false;

    const getStatusBadge = (status) => {
        const map = { Pending: 'badge-warning', Processing: 'badge-warning', Shipped: 'badge-success', Delivered: 'badge-success', Cancelled: 'badge-danger' };
        return `<span class="badge ${map[status] || 'badge-warning'}">${status}</span>`;
    };

    const buildReceiptHtml = (order) => {
        let itemsRows = '';
        if (order.OrderItems) {
            order.OrderItems.forEach(item => {
                const name = item.Product ? item.Product.name : 'Product';
                const series = item.Product && item.Product.series ? `<br><small class="text-muted">${escapeHtml(item.Product.series)}</small>` : '';
                const subtotal = parseFloat(item.unit_price) * item.quantity;
                itemsRows += `<tr>
                    <td>${escapeHtml(name)}${series}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatPeso(item.unit_price)}</td>
                    <td class="text-right">${formatPeso(subtotal)}</td>
                </tr>`;
            });
        }
        const discountRow = order.discount_amount > 0
            ? `<div class="d-flex justify-content-between text-success mb-1"><span>Discount${order.discount_code ? ` (${order.discount_code})` : ''}</span><span>${formatPesoDiscount(order.discount_amount)}</span></div>`
            : '';
        return `
            <div class="mb-3"><strong>Order #${order.id}</strong> &middot; ${new Date(order.createdAt).toLocaleDateString()} &middot; ${getStatusBadge(order.status)}</div>
            <table class="receipt-modal-table table table-sm mb-3">
                <thead><tr><th>Product</th><th class="text-center">Qty</th><th class="text-right">Price</th><th class="text-right">Subtotal</th></tr></thead>
                <tbody>${itemsRows}</tbody>
            </table>
            <div class="d-flex justify-content-between mb-1"><span>Subtotal</span><span>${formatPeso(order.subtotal_amount || order.total_amount)}</span></div>
            ${discountRow}
            <div class="d-flex justify-content-between mb-3"><strong>Total</strong><strong class="text-primary">${formatPeso(order.total_amount)}</strong></div>
            <p class="mb-1"><strong>Payment:</strong> ${escapeHtml(order.payment_method || 'N/A')}</p>
            <p class="mb-0"><strong>Shipping:</strong><br>${escapeHtml(order.shipping_address || 'N/A').replace(/\n/g, '<br>')}</p>`;
    };

    const downloadReceiptPdf = (orderId, token) => {
        fetch(`${API_URL}/api/v1/orders/${orderId}/receipt`, {
            headers: { Authorization: 'Bearer ' + token }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to download receipt');
                return res.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-order-${orderId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            })
            .catch(() => Swal.fire({ icon: 'error', text: 'Could not download receipt PDF.' }));
    };

    let receiptModalOrderId = null;

    const renderOrderCard = (order) => {
        let itemsHtml = '';
        if (order.OrderItems) {
            order.OrderItems.forEach(item => {
                const reviewBtn = order.status === 'Delivered'
                    ? `<a href="product-detail?id=${item.product_id}" class="btn btn-secondary btn-sm"><i class="fas fa-star"></i> Write a Review</a>`
                    : '';
                itemsHtml += `<li class="order-item-row">
                    <div class="order-item-info">${escapeHtml(item.Product ? item.Product.name : 'Product')} x${item.quantity} @ ${formatPeso(item.unit_price)}</div>
                    ${reviewBtn ? `<div class="order-item-actions">${reviewBtn}</div>` : ''}
                </li>`;
            });
        }
        return `<div class="order-card">
            <div class="order-card-header">
                <div><strong>Order #${order.id}</strong> <small class="text-muted">${new Date(order.createdAt).toLocaleDateString()}</small></div>
                <div>${getStatusBadge(order.status)} <strong class="ml-2">${formatPeso(order.total_amount)}</strong>${order.discount_amount > 0 ? `<small class="text-success ml-1">(${formatPesoDiscount(order.discount_amount)})</small>` : ''}</div>
            </div>
            <ul class="order-items-list">${itemsHtml}</ul>
            <div class="order-card-footer">
                <small class="text-muted">Payment: ${escapeHtml(order.payment_method || 'N/A')}</small>
                <div class="order-receipt-actions">
                    <button type="button" class="btn btn-secondary btn-sm view-receipt-btn" data-id="${order.id}"><i class="fas fa-receipt"></i> View Receipt</button>
                    <button type="button" class="btn btn-primary btn-sm download-receipt-btn" data-id="${order.id}"><i class="fas fa-download"></i> Download PDF</button>
                </div>
            </div>
        </div>`;
    };

    const loadMoreOrders = () => {
        if (loading || displayedCount >= allOrders.length) return;
        loading = true;
        allOrders.slice(displayedCount, displayedCount + BATCH_SIZE).forEach(order => {
            $('#ordersContainer').append(renderOrderCard(order));
        });
        displayedCount += Math.min(BATCH_SIZE, allOrders.length - displayedCount);
        loading = false;
    };

    $(document).ready(function () {
        const token = getToken();
        if (!token) return;

        $('#navbar').load('header.html', function () {
            $('#authLinks').hide();
            $('#userLinks').show();
            const user = getUser();
            if (user && user.role === 'admin') $('#adminLink').show();
            $('#logoutBtn').on('click', function (e) {
                e.preventDefault();
                sessionStorage.clear();
                window.location.href = 'index.html';
            });
        });

        $.ajax({
            method: 'GET',
            url: `${window.API_URL}/api/v1/orders/my`,
            headers: { Authorization: 'Bearer ' + token },
            success: function (data) {
                allOrders = data.rows;
                if (!allOrders.length) {
                    $('#ordersContainer').html('<p class="text-center p-4">No orders yet.</p>');
                    return;
                }
                loadMoreOrders();
            }
        });

        $(window).on('scroll', function () {
            if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
                loadMoreOrders();
            }
        });

        $(document).on('click', '.view-receipt-btn', function () {
            const orderId = $(this).data('id');
            const order = allOrders.find(o => o.id === orderId);
            if (!order) return;
            receiptModalOrderId = orderId;
            $('#receiptModalBody').html(buildReceiptHtml(order));
            $('#receiptModal').modal('show');
        });

        $(document).on('click', '.download-receipt-btn, #receiptModalDownload', function () {
            const orderId = $(this).data('id') || receiptModalOrderId;
            if (orderId) downloadReceiptPdf(orderId, token);
        });
    });
}

