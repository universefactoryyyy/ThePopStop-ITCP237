const db = require('../models');
const User = db.User;
const Customer = db.Customer;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, addressline } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
        if (!phone || !addressline) return res.status(400).json({ error: 'Phone and address are required' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        let image_path = null;
        if (req.file) image_path = req.file.path.replace(/\\/g, '/');

        const nameParts = name.trim().split(' ');
        const fname = nameParts[0];
        const lname = nameParts.slice(1).join(' ') || '';

        await Customer.create({
            user_id: user.id,
            fname,
            lname,
            phone,
            addressline,
            image_path
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.log(err);
        if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Email already exists' });
        return res.status(500).json({ error: 'Error registering user' });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const user = await User.findOne({ where: { email, deleted_at: null } });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
        
        if (!user.is_active) return res.status(401).json({ success: false, message: 'Account Deactivated' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        await user.update({ token });

        const customer = await Customer.findOne({ where: { user_id: user.id } });

        return res.status(200).json({
            success: true,
            message: 'Welcome back',
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                avatar: customer?.image_path || null
            },
            token
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error logging in' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.body.user.id;
        const user = await User.findByPk(userId, { attributes: ['id', 'name', 'email', 'role'] });
        const customer = await Customer.findOne({ where: { user_id: userId } });
        return res.status(200).json({ user, customer });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { fname, lname, addressline, zipcode, phone, userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });

        let image_path = null;
        if (req.file) image_path = req.file.path.replace(/\\/g, '/');

        const [customer, created] = await Customer.findOrCreate({
            where: { user_id: userId },
            defaults: { fname, lname, addressline, zipcode, phone, image_path, user_id: userId }
        });
        if (!created) {
            await customer.update({
                fname: fname || customer.fname,
                lname: lname || customer.lname,
                addressline: addressline || customer.addressline,
                zipcode: zipcode || customer.zipcode,
                phone: phone || customer.phone,
                image_path: image_path || customer.image_path
            });
        }
        // Get updated user
        const updatedUser = await User.findByPk(userId, { attributes: ['id', 'name', 'email', 'role'] });
        // Include avatar
        const customerData = await Customer.findOne({ where: { user_id: userId } });
        const userWithAvatar = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatar: customerData?.image_path || null
        };
        return res.status(200).json({ success: true, message: 'Profile updated', user: userWithAvatar, customer: customerData });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error updating profile' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password', 'token'] } });
        return res.status(200).json({ rows: users });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching users' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.role === 'customer') {
            return res.status(403).json({ error: 'Cannot change role of a customer' });
        }
        
        await User.update({ role }, { where: { id } });
        return res.status(200).json({ success: true, message: 'Role updated' });
    } catch (err) {
        return res.status(500).json({ error: 'Error updating role' });
    }
};

exports.deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const newStatus = user.is_active ? 0 : 1;
        await user.update({ is_active: newStatus });

        return res.status(200).json({ success: true, message: newStatus ? 'User activated' : 'User deactivated' });
    } catch (err) {
        return res.status(500).json({ error: 'Error updating user status' });
    }
};
