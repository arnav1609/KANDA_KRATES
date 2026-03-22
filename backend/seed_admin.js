import mongoose from 'mongoose';
import Admin from './models/Admin.js';

mongoose.connect('mongodb://127.0.0.1:27017/kandakrates')
  .then(async () => {
    const existing = await Admin.findOne({ username: 'admin' });
    if (existing) {
      console.log('Admin already exists.');
    } else {
      await Admin.create({ 
        username: 'admin', 
        password: 'password123', 
        phoneNumber: '0000000000' 
      });
      console.log('Successfully created default Admin: (admin / password123)');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to seed:', err);
    process.exit(1);
  });
