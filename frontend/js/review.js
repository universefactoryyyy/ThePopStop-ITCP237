// Review helpers — product review form is in product.js
// Admin review moderation is inline in admin/reviews.html

const API_URL = 'http://localhost:4000';

const renderStars = (rating) => {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return stars;
};
