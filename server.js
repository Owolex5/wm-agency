// server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// NowPayments Configuration
const NOWPAYMENTS_API_KEY = '43YSWXS-H2B4W8T-QYGD3CH-4KF7S6Y';
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

// Payment endpoint - Create payment and redirect
app.post('/api/create-booking', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      company,
      eventName,
      eventDate,
      location,
      budget,
      requestType,
      notes,
      celebrityId,
      celebrityName,
      userId
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !eventName || !eventDate || !location || !budget || !requestType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please fill in all required fields' 
      });
    }

    // 1. Save booking to Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        user_id: userId || null,
        celebrity_id: celebrityId || null,
        event_name: eventName,
        event_type: requestType,
        event_date: eventDate,
        event_location: location,
        budget: parseFloat(budget.replace(/[^0-9.-]/g, '')) || 0,
        status: 'pending',
        payment_status: 'pending',
        special_requests: notes,
        total_amount: 200, // $200 deposit
        customer_name: fullName,
        customer_email: email,
        customer_phone: phone,
        customer_company: company || null
      }])
      .select()
      .single();

    if (bookingError) {
      console.error('Supabase error:', bookingError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save booking' 
      });
    }

    // 2. Create payment with NowPayments
    const paymentData = {
      price_amount: 200,
      price_currency: 'usd',
      pay_currency: 'usd',
      order_id: `BOOKING_${booking.id}`,
      order_description: `Booking deposit for ${celebrityName || 'Celebrity'} - ${eventName}`,
      ipn_callback_url: `${process.env.BASE_URL}/api/payment-webhook`,
      success_url: `${process.env.FRONTEND_URL}/payment-success.html?booking_id=${booking.id}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled.html?booking_id=${booking.id}`,
      purchaser_name: fullName,
      purchaser_email: email
    };

    const paymentResponse = await axios.post(
      `${NOWPAYMENTS_API_URL}/payment`,
      paymentData,
      {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (paymentResponse.data && paymentResponse.data.payment_url) {
      // Update booking with payment ID
      await supabase
        .from('bookings')
        .update({ 
          payment_id: paymentResponse.data.payment_id,
          payment_url: paymentResponse.data.payment_url
        })
        .eq('id', booking.id);

      return res.json({
        success: true,
        booking_id: booking.id,
        payment_url: paymentResponse.data.payment_url,
        payment_id: paymentResponse.data.payment_id
      });
    } else {
      throw new Error('Payment URL not received');
    }

  } catch (error) {
    console.error('Booking error:', error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to create payment'
    });
  }
});

// Webhook endpoint for NowPayments to update payment status
app.post('/api/payment-webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('Webhook received:', webhookData);

    const { payment_status, order_id, payment_id, price_amount, pay_amount } = webhookData;

    if (order_id && order_id.startsWith('BOOKING_')) {
      const bookingId = parseInt(order_id.replace('BOOKING_', ''));

      if (payment_status === 'finished' || payment_status === 'confirmed') {
        // Update booking status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            payment_confirmed_at: new Date().toISOString(),
            payment_amount: price_amount || pay_amount,
            payment_id: payment_id
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking:', updateError);
        } else {
          // Get booking to add points to user
          const { data: booking } = await supabase
            .from('bookings')
            .select('user_id')
            .eq('id', bookingId)
            .single();

          if (booking && booking.user_id) {
            // Add points to user (100 points for $200 deposit)
            const { data: profile } = await supabase
              .from('profiles')
              .select('points')
              .eq('id', booking.user_id)
              .single();

            if (profile) {
              await supabase
                .from('profiles')
                .update({ points: (profile.points || 0) + 100 })
                .eq('id', booking.user_id);

              // Record points transaction
              await supabase
                .from('points_transactions')
                .insert({
                  user_id: booking.user_id,
                  points: 100,
                  type: 'earn',
                  source: 'booking_deposit',
                  description: `Booking deposit for order #${bookingId}`
                });
            }
          }
        }
      } else if (payment_status === 'failed' || payment_status === 'expired') {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'failed',
            status: 'cancelled'
          })
          .eq('id', bookingId);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check payment status endpoint
app.get('/api/check-payment/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('payment_status, status, payment_id')
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    // If payment_id exists, check with NowPayments
    if (booking.payment_id) {
      const paymentCheck = await axios.get(
        `${NOWPAYMENTS_API_URL}/payment/${booking.payment_id}`,
        {
          headers: { 'x-api-key': NOWPAYMENTS_API_KEY }
        }
      );

      if (paymentCheck.data.payment_status === 'finished') {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed'
          })
          .eq('id', bookingId);
          
        booking.payment_status = 'paid';
        booking.status = 'confirmed';
      }
    }

    res.json({
      success: true,
      payment_status: booking.payment_status,
      booking_status: booking.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking details
app.get('/api/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, celebrities(name, image_url, category)')
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});