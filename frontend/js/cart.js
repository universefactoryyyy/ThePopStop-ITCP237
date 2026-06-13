const getToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        Swal.fire({ icon: 'warning', text: 'You must be logged in.', showConfirmButton: true })
            .then(() => window.location.href = 'login.html');
        return null;
    }
    return JSON.parse(token);
};

let cartRows = [];

const getSelectedCartIds = () =>
    $('.cart-select:checked').map(function () { return parseInt($(this).data('id'), 10); }).get();

const updateCartSelectionUI = () => {
    const selectedIds = getSelectedCartIds();
    const selectedItems = cartRows.filter(item => selectedIds.includes(item.id));
    const selectedTotal = selectedItems.reduce((sum, item) => {
        const p = item.Product;
        return p ? sum + parseFloat(p.price) * item.quantity : sum;
    }, 0);

    $('#cartTotal').text(formatPeso(selectedTotal));
    $('#selectedCount').text(selectedIds.length);
    $('#cartItemCount').text(cartRows.length);
    $('#selectAllCart').prop('checked', cartRows.length > 0 && selectedIds.length === cartRows.length);
    $('#checkoutBtn').prop('disabled', selectedIds.length === 0);
};

const loadCart = () => {
    const token = getToken();
    if (!token) return;

    $.ajax({
        method: 'GET',
        url: `${API_URL}/api/v1/cart`,
        headers: { Authorization: 'Bearer ' + token },
        success: function (data) {
            cartRows = data.rows || [];
            let html = '';
            cartRows.forEach(item => {
                const p = item.Product;
                if (!p) return;
                const subtotal = parseFloat(p.price) * item.quantity;
                html += `<tr>
                    <td><input type="checkbox" class="cart-select" data-id="${item.id}" checked></td>
                    <td><img src="${getImageUrl(p.image_url)}" width="60" height="60" style="object-fit:cover;border-radius:8px;" onerror="this.src='images/placeholder.svg'"></td>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${formatPeso(p.price)}</td>
                    <td><input type="number" class="form-control qty-input" data-id="${item.id}" value="${item.quantity}" min="1" style="width:80px;"></td>
                    <td>${formatPeso(subtotal)}</td>
                    <td><button class="btn btn-danger btn-sm remove-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button></td>
                </tr>`;
            });
            $('#cartBody').html(html || '<tr><td colspan="7" class="text-center">Your cart is empty.</td></tr>');
            $('#checkoutBtn').toggle(cartRows.length > 0);
            updateCartSelectionUI();
        },
        error: function (xhr) {
            const msg = xhr.status === 401
                ? 'Session expired. Please login again.'
                : 'Could not load cart. Make sure the backend is running on port 4000.';
            $('#cartBody').html(`<tr><td colspan="7" class="text-center text-danger">${msg}</td></tr>`);
            if (xhr.status === 401) {
                sessionStorage.clear();
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            }
        }
    });
};

$(document).ready(function () {
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

    loadCart();

    $(document).on('change', '.cart-select, #selectAllCart', function () {
        if ($(this).is('#selectAllCart')) {
            $('.cart-select').prop('checked', $(this).is(':checked'));
        }
        updateCartSelectionUI();
    });

    $('#checkoutBtn').on('click', function () {
        const selectedIds = getSelectedCartIds();
        if (!selectedIds.length) {
            Swal.fire({ icon: 'warning', text: 'Select at least one item to checkout.' });
            return;
        }
        sessionStorage.setItem('checkoutCartIds', JSON.stringify(selectedIds));
        window.location.href = 'checkout.html';
    });

    $(document).on('change', '.qty-input', function () {
        const token = getToken();
        if (!token) return;
        const id = $(this).data('id');
        const quantity = parseInt($(this).val());
        if (quantity < 1) {
            Swal.fire({ icon: 'error', text: 'Quantity must be at least 1.' });
            loadCart();
            return;
        }
        $.ajax({
            method: 'PUT',
            url: `${API_URL}/api/v1/cart/${id}`,
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: JSON.stringify({ quantity }),
            success: loadCart,
            error: function () { Swal.fire({ icon: 'error', text: 'Failed to update quantity.' }); loadCart(); }
        });
    });

    $(document).on('click', '.remove-btn', function () {
        const token = getToken();
        if (!token) return;
        const id = $(this).data('id');
        Swal.fire({ title: 'Remove item?', icon: 'question', showCancelButton: true }).then(result => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${API_URL}/api/v1/cart/${id}`,
                    headers: { Authorization: 'Bearer ' + token },
                    success: function () {
                        Swal.fire({ icon: 'success', text: 'Item removed.', timer: 1000, showConfirmButton: false });
                        loadCart();
                    }
                });
            }
        });
    });
});
