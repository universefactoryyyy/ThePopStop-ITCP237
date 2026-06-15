const PER_PAGE = 8;

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;

const renderProducts = () => {
    const start = (currentPage - 1) * PER_PAGE;
    const pageProducts = filteredProducts.slice(start, start + PER_PAGE);
    let html = '';

    pageProducts.forEach(p => {
        html += buildProductCard(p);
    });

    $('#productGrid').html(html || '<p class="text-center p-4">No products found.</p>');
    renderPagination();
};

const renderPagination = () => {
    const totalPages = Math.ceil(filteredProducts.length / PER_PAGE) || 1;
    let html = '';
    if (currentPage > 1) html += `<button type="button" class="page-btn" data-page="${currentPage - 1}">&laquo; Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button type="button" class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (currentPage < totalPages) html += `<button type="button" class="page-btn" data-page="${currentPage + 1}">Next &raquo;</button>`;
    $('#pagination').html(html);
};

const populateFilterOptions = () => {
    const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
    const series = [...new Set(allProducts.map(p => p.series).filter(Boolean))].sort();

    brands.forEach(b => $('#brandFilter').append(`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`));
    series.forEach(s => $('#seriesFilter').append(`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`));
};

const applyFilters = () => {
    const search = $('#searchInput').val().trim().toLowerCase();
    const brand = $('#brandFilter').val();
    const series = $('#seriesFilter').val();
    const status = $('#statusFilter').val();
    const sort = $('#sortFilter').val();

    filteredProducts = allProducts.filter(p => {
        if (brand && p.brand !== brand) return false;
        if (series && p.series !== series) return false;
        if (status && p.status !== status) return false;
        if (search) {
            const haystack = `${p.name} ${p.brand || ''} ${p.series || ''} ${p.sku || ''}`.toLowerCase();
            if (!haystack.includes(search)) return false;
        }
        return true;
    });

    if (sort === 'price_asc') {
        filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sort === 'price_desc') {
        filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    currentPage = 1;
    renderProducts();
};

const loadProducts = () => {
    $.ajax({
        method: 'GET',
        url: `${window.API_URL}/api/v1/products`,
        success: function (data) {
            allProducts = data.rows;
            filteredProducts = [...allProducts];
            populateFilterOptions();
            renderProducts();
        },
        error: function () {
            $('#productGrid').html('<p class="text-center p-4 text-danger">Could not load products. Start the backend with npm start in the backend folder.</p>');
        }
    });
};

$(document).ready(function () {
    initNavbar();
    loadProducts();

    $('#searchInput, #brandFilter, #seriesFilter, #statusFilter, #sortFilter').on('input change', applyFilters);

    $('#clearFilters').on('click', function () {
        $('#searchInput').val('');
        $('#brandFilter').val('');
        $('#seriesFilter').val('');
        $('#statusFilter').val('');
        $('#sortFilter').val('');
        applyFilters();
    });

    $(document).on('click', '.page-btn', function () {
        currentPage = parseInt($(this).data('page'), 10);
        renderProducts();
        $('html, body').animate({ scrollTop: $('#productGrid').offset().top - 100 }, 300);
    });
});
