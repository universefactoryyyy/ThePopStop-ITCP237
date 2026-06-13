const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { getAllProducts, getSingleProduct, createProduct, updateProduct, deleteProduct, uploadPhotos, searchAutocomplete } = require('../controllers/product');
const { isAdmin } = require('../middlewares/auth');

router.get('/products', getAllProducts);
router.get('/products/search', searchAutocomplete);
router.get('/products/:id', getSingleProduct);
router.post('/products', isAdmin, upload.single('image'), createProduct);
router.put('/products/:id', isAdmin, upload.single('image'), updateProduct);
router.delete('/products/:id', isAdmin, deleteProduct);
router.post('/products/:product_id/photos', isAdmin, upload.array('photos', 10), uploadPhotos);

module.exports = router;
