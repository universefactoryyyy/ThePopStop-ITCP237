window.API_URL = window.API_URL || 'http://localhost:4000';

const getToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        Swal.fire({ icon: 'warning', text: 'You must be logged in.', showConfirmButton: true })
            .then(() => window.location.href = '../login.html');
        return null;
    }
    return JSON.parse(token);
};

const checkAdmin = () => {
    const user = sessionStorage.getItem('user');
    if (!user) { window.location.href = '../index.html'; return false; }
    if (JSON.parse(user).role !== 'admin') { window.location.href = '../index.html'; return false; }
    return true;
};

const getImageUrl = (path) => {
    if (!path) return '../images/placeholder.svg';
    if (path.startsWith('http')) return path;
    if (path.startsWith('uploads/')) return `${window.API_URL}/${path}`;
    if (path.startsWith('images/')) return `../${path}`;
    return `${window.API_URL}/${path}`;
};

const renderPhotoItem = (src, label) => `
    <div class="photo-gallery-item">
        <span class="photo-label">${label}</span>
        <img src="${src}" alt="${label}" onerror="this.src='../images/placeholder.svg'">
    </div>`;

const loadCurrentPhotos = (productId, token) => {
    $('#currentPhotos').html('<p class="text-muted">Loading...</p>');
    $.ajax({
        method: 'GET',
        url: `${API_URL}/api/v1/products/${productId}`,
        headers: { Authorization: 'Bearer ' + token },
        success: function (data) {
            const p = data.result;
            let html = '';
            if (p.image_url) {
                html += renderPhotoItem(getImageUrl(p.image_url), 'Main Photo');
            }
            if (p.ProductPhotos && p.ProductPhotos.length) {
                p.ProductPhotos.forEach((photo, i) => {
                    html += renderPhotoItem(getImageUrl(photo.photo_path), `Additional ${i + 1}`);
                });
            }
            $('#currentPhotos').html(html || '<p class="text-muted">No photos yet.</p>');
        },
        error: function () {
            $('#currentPhotos').html('<p class="text-danger">Could not load photos.</p>');
        }
    });
};

const uploadAdditionalPhotos = (productId, files, token, onComplete) => {
    if (!files || !files.length) {
        onComplete();
        return;
    }
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('photos', f));
    $.ajax({
        method: 'POST',
        url: `${window.API_URL}/api/v1/products/${productId}/photos`,
        data: formData,
        contentType: false,
        processData: false,
        headers: { Authorization: 'Bearer ' + token },
        success: onComplete,
        error: function (xhr) {
            Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Failed to upload additional photos.' });
            onComplete();
        }
    });
};

let productTable;
let editId = null;
let photoProductId = null;
let photoFiles = [];

$(document).ready(function () {
    if (!checkAdmin()) return;
    const token = getToken();
    if (!token) return;

    $('.sidebar-nav a[data-page="products"]').addClass('active');

    productTable = $('#productTable').DataTable({
        ajax: {
            url: `${API_URL}/api/v1/products`,
            dataSrc: 'rows',
            headers: { Authorization: 'Bearer ' + token }
        },
        columns: [
            { data: 'id' },
            {
                data: null,
                orderable: false,
                render: (data) => `<img src="${getImageUrl(data.image_url)}" class="admin-table-img" alt="" onerror="this.src='../images/placeholder.svg'">`
            },
            { data: 'name' },
            { data: 'series' },
            { data: 'brand' },
            { data: 'sku' },
            { data: 'price', render: (d) => '₱' + parseFloat(d).toFixed(2) },
            { data: 'stock_quantity' },
            { data: 'status' },
            {
                data: null,
                render: (data) => `
                    <div class="admin-actions">
                        <button class="btn btn-secondary btn-sm edit-btn" data-id="${data.id}" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${data.id}" title="Delete"><i class="fas fa-trash"></i></button>
                        <button class="btn btn-primary btn-sm photos-btn" data-id="${data.id}" title="Photos"><i class="fas fa-images"></i></button>
                    </div>`
            }
        ]
    });

    $('#addProductBtn').on('click', function () {
        editId = null;
        $('#productForm')[0].reset();
        $('#pAdditionalPreview').empty();
        $('#productModalTitle').text('Add Product');
        $('#productModal').modal('show');
    });

    $('#pAdditionalPhotos').on('change', function () {
        $('#pAdditionalPreview').empty();
        Array.from(this.files).forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                $('#pAdditionalPreview').append(renderPhotoItem(e.target.result, `New ${i + 1}`));
            };
            reader.readAsDataURL(file);
        });
    });

    $('#saveProductBtn').on('click', function () {
        const name = $('#pName').val().trim();
        const sku = $('#pSku').val().trim();
        const price = $('#pPrice').val();
        let valid = true;

        if (!name) { $('#pNameError').show(); valid = false; } else { $('#pNameError').hide(); }
        if (!sku) { $('#pSkuError').show(); valid = false; } else { $('#pSkuError').hide(); }
        if (!price || isNaN(price)) { $('#pPriceError').show(); valid = false; } else { $('#pPriceError').hide(); }
        if (!valid) return;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('series', $('#pSeries').val());
        formData.append('brand', $('#pBrand').val());
        formData.append('price', price);
        formData.append('cost_price', $('#pCostPrice').val());
        formData.append('sku', sku);
        formData.append('description', $('#pDescription').val());
        formData.append('stock_quantity', $('#pStock').val() || 0);
        formData.append('status', $('#pStatus').val());
        if ($('#pImage')[0].files[0]) formData.append('image', $('#pImage')[0].files[0]);

        const additionalFiles = $('#pAdditionalPhotos')[0].files;
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `${API_URL}/api/v1/products/${editId}` : `${API_URL}/api/v1/products`;

        $.ajax({
            method,
            url,
            data: formData,
            contentType: false,
            processData: false,
            headers: { Authorization: 'Bearer ' + token },
            success: function (response) {
                const productId = editId || response.product?.id;
                const finishSave = () => {
                    $('#productModal').modal('hide');
                    productTable.ajax.reload();
                    Swal.fire({ icon: 'success', text: editId ? 'Product updated!' : 'Product created!', timer: 1500, showConfirmButton: false });
                };

                if (!editId && additionalFiles.length && productId) {
                    uploadAdditionalPhotos(productId, additionalFiles, token, finishSave);
                } else if (editId && additionalFiles.length) {
                    uploadAdditionalPhotos(editId, additionalFiles, token, finishSave);
                } else {
                    finishSave();
                }
            },
            error: function (xhr) {
                Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Failed to save product.' });
            }
        });
    });

    $(document).on('click', '.edit-btn', function () {
        const id = $(this).data('id');
        editId = id;
        const row = productTable.row($(this).closest('tr')).data();
        $('#pName').val(row.name);
        $('#pSeries').val(row.series);
        $('#pBrand').val(row.brand);
        $('#pPrice').val(row.price);
        $('#pCostPrice').val(row.cost_price);
        $('#pSku').val(row.sku);
        $('#pDescription').val(row.description);
        $('#pStock').val(row.stock_quantity);
        $('#pStatus').val(row.status);
        $('#pAdditionalPreview').empty();
        $('#productModalTitle').text('Edit Product');
        $('#productModal').modal('show');
    });

    $(document).on('click', '.delete-btn', function () {
        const id = $(this).data('id');
        Swal.fire({ title: 'Delete product?', icon: 'warning', showCancelButton: true }).then(result => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${window.API_URL}/api/v1/products/${id}`,
                    headers: { Authorization: 'Bearer ' + token },
                    success: function () {
                        productTable.ajax.reload();
                        Swal.fire({ icon: 'success', text: 'Product deleted.', timer: 1500, showConfirmButton: false });
                    }
                });
            }
        });
    });

    $(document).on('click', '.photos-btn', function () {
        photoProductId = $(this).data('id');
        photoFiles = [];
        $('#photoPreview').empty();
        $('#photosModal').modal('show');
        loadCurrentPhotos(photoProductId, token);
    });

    const dropzone = $('#dropzone');
    dropzone.on('click', () => $('#photoInput').click());
    dropzone.on('dragover', (e) => { e.preventDefault(); dropzone.addClass('dragover'); });
    dropzone.on('dragleave', () => dropzone.removeClass('dragover'));
    dropzone.on('drop', (e) => {
        e.preventDefault();
        dropzone.removeClass('dragover');
        handlePhotoFiles(e.originalEvent.dataTransfer.files);
    });
    $('#photoInput').on('change', function () { handlePhotoFiles(this.files); });

    function handlePhotoFiles(files) {
        Array.from(files).forEach((f, i) => {
            photoFiles.push(f);
            const reader = new FileReader();
            reader.onload = (e) => {
                $('#photoPreview').append(renderPhotoItem(e.target.result, `Upload ${$('#photoPreview .photo-gallery-item').length + 1}`));
            };
            reader.readAsDataURL(f);
        });
    }

    $('#uploadPhotosBtn').on('click', function () {
        if (!photoFiles.length) {
            Swal.fire({ icon: 'warning', text: 'Select files to upload.' });
            return;
        }
        uploadAdditionalPhotos(photoProductId, photoFiles, token, function () {
            photoFiles = [];
            $('#photoPreview').empty();
            loadCurrentPhotos(photoProductId, token);
            productTable.ajax.reload();
            Swal.fire({ icon: 'success', text: 'Photos uploaded!', timer: 1500, showConfirmButton: false });
        });
    });
});
