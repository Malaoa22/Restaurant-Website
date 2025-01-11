const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Reservation Schema
const reservationSchema = new mongoose.Schema({
    name: String,
    email: String,
    date: Date,
    paymentMethod: String,
    cardDetails: {
        cardNumber: String,
        expiryDate: String,
        cvv: String
    },
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to HAM&OUI FOOD Backend!');
});

// Create Reservation
app.post('/api/reservations', async (req, res) => {
    const { name, email, date, paymentMethod, cardDetails } = req.body;

    // Validate required fields
    if (!name || !email || !date || !paymentMethod) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const newReservation = new Reservation({
            name,
            email,
            date,
            paymentMethod,
            cardDetails: paymentMethod === 'card' ? cardDetails : null,
        });
        await newReservation.save();

        res.status(201).json({ message: 'Reservation created successfully!' });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Failed to create reservation.' });
    }
});

// Payment Processing (Stripe)
app.post('/api/payment', async (req, res) => {
    const { amount, paymentMethodId } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method: paymentMethodId,
            confirm: true,
        });

        res.status(200).json({ success: true, paymentIntent });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Payment processing failed.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
