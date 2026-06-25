const getOptionalToken = () => {
    const token = sessionStorage.getItem('token');
    return token ? JSON.parse(token) : null;
};

let currentProductId = null;
let eligibleOrders = [];
let myReviews = [];

const loadReviews = (productId) => {
    $.ajax({
        method: 'GET',
        url: `${window.API_URL}/api/v1/reviews/product/${productId}`,
        success: function (data) {
            if (!data.rows.length) {
                $('#reviewsList').html('<p class="text-muted">No reviews yet. Be the first to review after your order is delivered!</p>');
                return;
            }
            let html = '';
            data.rows.forEach(r => {
                html += `<div class="review-item">
                    <div class="stars">${renderStars(r.rating)}</div>
                    <strong>${escapeHtml(r.is_anonymous ? 'Anonymous User' : (r.User ? r.User.name : 'User'))}</strong>
                    <small class="text-muted ml-2">${new Date(r.createdAt).toLocaleDateString()}</small>
                    <p class="mt-1">${escapeHtml(r.review_text || '')}</p>
                </div>`;
            });
            $('#reviewsList').html(html);
        }
    });
};

const renderMyReviews = () => {
    if (!myReviews.length) {
        $('#myReviewsWrap').hide();
        return;
    }
    let html = '';
    myReviews.forEach(r => {
        html += `<div class="review-item d-flex justify-content-between align-items-start">
            <div>
                <div class="stars">${renderStars(r.rating)}</div>
                <small class="text-muted">Order #${r.order_id}</small>
                ${!r.is_approved ? '<span class="badge badge-warning ml-2">Waiting for Approval</span>' : '<span class="badge badge-success ml-2">Approved</span>'}
                <p class="mt-1 mb-0">${escapeHtml(r.review_text || '')}</p>
            </div>
            <button type="button" class="btn btn-sm btn-secondary edit-review-btn" data-id="${r.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
        </div>`;
    });
    $('#myReviewsList').html(html);
    $('#myReviewsWrap').show();
};

const loadReviewEligibility = (productId) => {
    const token = getOptionalToken();
    if (!token) {
        $('#noReviewMsg').show();
        return;
    }

    $.ajax({
        method: 'GET',
        url: `${window.API_URL}/api/v1/reviews/eligible/${productId}`,
        headers: { Authorization: 'Bearer ' + token },
        success: function (data) {
            eligibleOrders = data.eligibleOrders || [];
            myReviews = data.myReviews || [];
            renderMyReviews();

            if (data.canReview) {
                $('#reviewFormWrap').show();
                $('#noReviewMsg').hide();
                // Auto-select first eligible order, hide the dropdown
                if (eligibleOrders.length > 0) {
                    let opts = '';
                    eligibleOrders.forEach(o => {
                        opts += `<option value="${o.id}">Order #${o.id} - ${new Date(o.date).toLocaleDateString()}</option>`;
                    });
                    $('#reviewOrderId').html(opts).val(eligibleOrders[0].id).closest('.form-group').hide();
                }
            } else {
                $('#reviewFormWrap').hide();
                if (!token) {
                    $('#noReviewMsg').text('Login to write a review after your order is delivered.').show();
                } else if (!myReviews.length) {
                    $('#noReviewMsg').text('You can write a review once you have a delivered order for this product.').show();
                } else {
                    $('#noReviewMsg').hide();
                }
            }
        }
    });
};

const resetReviewForm = () => {
    $('#editReviewId').val('');
    $('#reviewFormTitle').text('Write a Review');
    $('#reviewSubmitBtn').html('<i class="fas fa-paper-plane"></i> Submit Review');
    $('#cancelEditBtn').hide();
    $('#reviewForm')[0].reset();
    $('#reviewAnonymous').prop('checked', false);
    if (eligibleOrders.length) {
        let opts = '';
        eligibleOrders.forEach(o => {
            opts += `<option value="${o.id}">Order #${o.id} - ${new Date(o.date).toLocaleDateString()}</option>`;
        });
        $('#reviewOrderId').html(opts).val(eligibleOrders[0].id).closest('.form-group').hide();
    }
};

$(document).ready(function () {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    currentProductId = productId;

    if (!productId) {
        Swal.fire({ icon: 'error', text: 'No product selected.' })
            .then(() => { window.location.href = 'index.html'; });
        return;
    }

    initNavbar();

    $.ajax({
            method: 'GET',
            url: `${window.API_URL}/api/v1/products/${encodeURIComponent(productId)}`,
            success: function (data) {
                console.log('Product data:', data);
                const p = data.result;
                if (!p) {
                    Swal.fire({ icon: 'error', text: 'Product data could not be loaded.' });
                    return;
                }
                document.title = `${p.name} - The Pop Stop`;
                $('#productName').text(p.name);
                $('#breadcrumbName').text(p.name);
                $('#productBrand').text(`${p.series || ''} | ${p.brand || ''}`);
                $('#productSku').text(p.sku);
                $('#productPrice').text(formatPeso(p.price));
                $('#productDesc').text(p.description || 'No description available.');
                $('#productStatus').text(p.status);
                $('#productStatusBadge').html(getStatusBadge(p.status));
                $('#qtyInput').attr('max', p.stock_quantity);

                // Handle rating display only if there are reviews
                if (p.average_rating != null) {
                    $('#productRatingDisplay').html(renderStars(Math.round(p.average_rating)) + ` <span class="ml-1 text-muted">(${p.review_count} reviews)</span>`).show();
                } else {
                    $('#productRatingDisplay').hide();
                }

                // Add sold count
                if (p.sold_count > 0) {
                    const soldEl = $('<div class="mt-1 text-muted" id="productSold"></div>').text(`${p.sold_count} sold`);
                    if ($('#productRatingDisplay').is(':visible')) {
                        $('#productRatingDisplay').after(soldEl);
                    } else {
                        $('#productPrice').after(soldEl);
                    }
                }

                const mainImg = getImageUrl(p.image_url);
                $('#mainImage').attr('src', mainImg).on('error', function () { $(this).attr('src', 'images/placeholder.svg'); });

                let thumbs = `<img src="${mainImg}" class="active thumb-img" data-src="${mainImg}">`;
                if (p.ProductPhotos) {
                    p.ProductPhotos.forEach(photo => {
                        const src = getImageUrl(photo.photo_path);
                        thumbs += `<img src="${src}" class="thumb-img" data-src="${src}">`;
                    });
                }
                $('#galleryThumbs').html(thumbs);

                if (p.status === 'Out of Stock') {
                    $('#addCartBtn').prop('disabled', true).addClass('btn-disabled').html('<i class="fas fa-ban"></i> Out of Stock');
                    $('.product-action-btns .btn-outline').addClass('btn-disabled').attr('href', '#').attr('onclick', 'return false;').css('pointer-events', 'none');
                } else {
                    $('#addCartBtn').prop('disabled', false).removeClass('btn-disabled').html('<i class="fas fa-cart-plus"></i> Add to Cart');
                    $('.product-action-btns .btn-outline').removeClass('btn-disabled').attr('href', 'cart.html').removeAttr('onclick').css('pointer-events', 'auto');
                }
            },
        error: function (xhr) {
            const message = xhr.status === 404
                ? 'Product not found.'
                : 'Could not load product. Make sure the backend is running on port 4000.';
            Swal.fire({ icon: 'error', text: message }).then(() => {
                if (xhr.status === 404) window.location.href = 'index.html';
            });
        }
    });

    loadReviews(productId);
    loadReviewEligibility(productId);

    $(document).on('click', '.thumb-img', function () {
        $('#mainImage').attr('src', $(this).data('src'));
        $('.thumb-img').removeClass('active');
        $(this).addClass('active');
    });

    const addToCart = () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            Swal.fire({ icon: 'warning', text: 'Please login to add items to cart.' })
                .then(() => window.location.href = 'login.html');
            return null;
        }
        const authToken = JSON.parse(token);
        const qty = parseInt($('#qtyInput').val()) || 1;
        return $.ajax({
            method: 'POST',
            url: `${window.API_URL}/api/v1/cart`,
            headers: { Authorization: 'Bearer ' + authToken, 'Content-Type': 'application/json' },
            data: JSON.stringify({ product_id: parseInt(productId), quantity: qty })
        });
    };

    $('#addCartBtn').on('click', function () {
        if ($(this).prop('disabled')) return;
        const addPromise = addToCart();
        if (addPromise) {
            addPromise.then(() => {
                Swal.fire({ icon: 'success', text: 'Added to cart!', timer: 1500, showConfirmButton: false });
            }).catch(() => {
                Swal.fire({ icon: 'error', text: 'Failed to add to cart.' });
            });
        }
    });

    $('#buyNowBtn').on('click', function (e) {
        e.preventDefault();
        if ($(this).hasClass('btn-disabled') || $(this).css('pointer-events') === 'none') return;
        const addPromise = addToCart();
        if (addPromise) {
            addPromise.then(() => {
                window.location.href = 'cart.html';
            }).catch(() => {
                Swal.fire({ icon: 'error', text: 'Failed to add to cart.' });
            });
        }
    });

    $(document).on('click', '.edit-review-btn', function () {
        const id = parseInt($(this).data('id'));
        const review = myReviews.find(r => r.id === id);
        if (!review) return;
        const rating = review.rating;
        const text = review.review_text || '';
        const isAnonymous = review.is_anonymous;
        const orderId = review.order_id;
        $('#editReviewId').val(id);
        $('#reviewFormTitle').text('Edit Your Review');
        $('#reviewSubmitBtn').html('<i class="fas fa-save"></i> Update Review');
        $('#cancelEditBtn').show();
        $('#reviewRating').val(rating);
        $('#reviewText').val(text);
        $('#reviewAnonymous').prop('checked', isAnonymous);
        $('#reviewOrderId').html(`<option value="${orderId}" selected>Order #${orderId}</option>`).prop('disabled', true);
        $('#reviewFormWrap').show();
        $('html, body').animate({ scrollTop: $('#reviewFormWrap').offset().top - 80 }, 300);
    });

    $('#cancelEditBtn').on('click', resetReviewForm);

    $('#reviewForm').on('submit', function (e) {
        e.preventDefault();
        const token = getOptionalToken();
        if (!token) {
            Swal.fire({ icon: 'warning', text: 'Please login to submit a review.' })
                .then(() => window.location.href = 'login.html');
            return;
        }

        const editId = $('#editReviewId').val();
        const rating = parseInt($('#reviewRating').val());
        const review_text = $('#reviewText').val().trim();
        const is_anonymous = $('#reviewAnonymous').prop('checked');
        const order_id = parseInt($('#reviewOrderId').val());

        let valid = true;
        if (!rating || rating < 1 || rating > 5) { $('#ratingError').show(); valid = false; } else { $('#ratingError').hide(); }
        if (review_text.length > 500) { $('#textError').text('Comment must be 500 characters or less.').show(); valid = false; } else { $('#textError').hide(); }
        if (!editId && !order_id) { $('#orderError').show(); valid = false; } else { $('#orderError').hide(); }
        if (!valid) return;

        const isEdit = !!editId;
        $.ajax({
            method: isEdit ? 'PUT' : 'POST',
            url: isEdit ? `${window.API_URL}/api/v1/reviews/${editId}` : `${window.API_URL}/api/v1/reviews`,
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: JSON.stringify(isEdit
                ? { rating, review_text, is_anonymous }
                : { product_id: parseInt(productId), order_id, rating, review_text, is_anonymous }),
            success: function () {
                Swal.fire({ icon: 'success', text: isEdit ? 'Review updated!' : 'Review submitted!', timer: 1500, showConfirmButton: false });
                resetReviewForm();
                $('#reviewOrderId').prop('disabled', false);
                loadReviews(productId);
                loadReviewEligibility(productId);
            },
            error: function (xhr) {
                Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Failed to submit review.' });
            }
        });
    });
});
