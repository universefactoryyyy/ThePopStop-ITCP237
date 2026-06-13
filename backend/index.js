const app = require('./app');
require('dotenv').config();
const db = require('./models');

const PORT = process.env.PORT || 4000;

db.sequelize.sync({ alter: false }).then(() => {
    console.log('Database connected.');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
