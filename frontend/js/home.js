const PER_PAGE = 8;

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let selectedBrand = '';

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

const applyFilters = () => {
    filteredProducts = allProducts.filter(p => {
        if (selectedBrand && p.brand !== selectedBrand) return false;
        return true;
    });
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
            renderProducts();
            renderBrandFilters();
        },
        error: function () {
            $('#productGrid').html('<p class="text-center p-4 text-danger">Could not load products. Start the backend with npm start in the backend folder.</p>');
        }
    });
};

const renderBrandFilters = () => {
    const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
    let html = '<button type="button" class="brand-btn active" data-brand="">All Brands</button>';
    brands.forEach(b => {
        html += `<button type="button" class="brand-btn" data-brand="${escapeHtml(b)}">${escapeHtml(b)}</button>`;
    });
    $('#brandFilters').html(html);
};

$(document).ready(function () {
    initNavbar();
    loadProducts();

    $('#searchInput').autocomplete({
        source: function (request, response) {
            $.ajax({
                url: `${window.API_URL}/api/v1/products/search`,
                data: { q: request.term },
                success: function (data) {
                    response(data.rows.map(p => ({
                        label: `${p.name} (${p.brand}) - ${formatPeso(p.price)}`,
                        value: p.name,
                        id: p.id
                    })));
                }
            });
        },
        minLength: 2,
        select: function (event, ui) {
            event.preventDefault();
            window.location.href = productDetailUrl(ui.item.id);
        }
    });

    $(document).on('click', '.brand-btn', function () {
        $('.brand-btn').removeClass('active');
        $(this).addClass('active');
        selectedBrand = $(this).data('brand') || '';
        applyFilters();
    });

    $(document).on('click', '.page-btn', function () {
        currentPage = parseInt($(this).data('page'), 10);
        renderProducts();
        $('html, body').animate({ scrollTop: $('#productGrid').offset().top - 100 }, 300);
    });
});
