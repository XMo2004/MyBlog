const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// In-memory store for verification codes (phone -> {code, expiresAt})
const verificationCodes = new Map();

// In-memory store for CAPTCHA codes (captchaId -> {text, expiresAt})
const captchaCodes = new Map();

// Clean up expired CAPTCHAs periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [id, data] of captchaCodes.entries()) {
        if (now > data.expiresAt) {
            captchaCodes.delete(id);
        }
    }
}, 5 * 60 * 1000);

exports.getCaptcha = (req, res) => {
    const captcha = svgCaptcha.create({
        size: 4,
        ignoreChars: '0o1i',
        noise: 2,
        color: true,
        background: '#f0f0f0'
    });

    const captchaId = uuidv4();
    captchaCodes.set(captchaId, {
        text: captcha.text.toLowerCase(),
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    res.json({
        captchaId,
        svg: captcha.data
    });
};

exports.sendVerificationCode = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ message: 'Phone number required' });
        }
        // Simple phone validation
        if (!/^\d{11}$/.test(phone)) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }

        // Check if phone already registered
        const existingUser = await prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
             return res.status(400).json({ message: 'Phone number already registered' });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store code with 5-minute expiration
        verificationCodes.set(phone, {
            code,
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        // Mock sending SMS
        console.log(`[MOCK SMS] Verification code for ${phone}: ${code}`);

        res.json({ message: 'Verification code sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkAvailability = async (req, res) => {
    try {
        const { type, value } = req.body;
        if (!type || !value) {
            return res.status(400).json({ message: 'Type and value are required' });
        }

        if (type === 'username') {
            const user = await prisma.user.findUnique({ where: { username: value } });
            return res.json({ available: !user });
        } else if (type === 'phone') {
            const user = await prisma.user.findUnique({ where: { phone: value } });
            return res.json({ available: !user });
        } else {
            return res.status(400).json({ message: 'Invalid type' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password, phone, verificationCode, captchaId, captchaText } = req.body;
        if (!username || !password || !phone || !verificationCode || !captchaId || !captchaText) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Verify CAPTCHA first
        const storedCaptcha = captchaCodes.get(captchaId);
        if (!storedCaptcha) {
            return res.status(400).json({ message: 'CAPTCHA expired or invalid' });
        }
        if (storedCaptcha.text !== captchaText.toLowerCase()) {
            return res.status(400).json({ message: 'Invalid CAPTCHA' });
        }
        // Delete used CAPTCHA
        captchaCodes.delete(captchaId);

        const u = String(username).trim();
        const p = String(password);
        if (!/^[A-Za-z0-9_]{3,32}$/.test(u)) {
            return res.status(400).json({ message: 'Invalid username' });
        }
        if (p.length < 8) {
            return res.status(400).json({ message: 'Password too short' });
        }

        // Verify code
        const storedData = verificationCodes.get(phone);
        if (!storedData) {
            return res.status(400).json({ message: 'Verification code expired or not sent' });
        }
        if (storedData.code !== verificationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        if (Date.now() > storedData.expiresAt) {
            verificationCodes.delete(phone);
            return res.status(400).json({ message: 'Verification code expired' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: u },
                    { phone: phone }
                ]
            }
        });
        if (existingUser) {
            if (existingUser.username === u) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(p, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username: u,
                password: hashedPassword,
                phone: phone
            },
        });

        // Clear verification code
        verificationCodes.delete(phone);

        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
        console.error(error);
        // Handle Prisma unique constraint violation
        if (error.code === 'P2002') {
            const target = error.meta?.target;
            if (target && (target.includes('username') || target === 'User_username_key')) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            if (target && (target.includes('phone') || target === 'User_phone_key')) {
                return res.status(400).json({ message: 'Phone number already registered' });
            }
            return res.status(400).json({ message: 'User already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role, membershipType: user.membershipType },
            process.env.JWT_SECRET,
            { expiresIn: '1d', issuer: 'blog', audience: 'blog-client' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role, membershipType: user.membershipType } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true,
                phone: true,
                role: true,
                membershipType: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const { nickname, avatar } = req.body;
        let nicknameToUpdate = undefined;
        
        if (nickname !== undefined) {
            const nicknameStr = String(nickname).trim();
            
            // 1. Validation: Chinese, English, digits only
            if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(nicknameStr)) {
                return res.status(400).json({ message: 'Nickname can only contain Chinese, English letters, and numbers' });
            }

            // 2. Uniqueness check
            const existingUser = await prisma.user.findFirst({
                where: {
                    nickname: nicknameStr,
                    NOT: {
                        id: req.user.userId
                    }
                }
            });

            if (existingUser) {
                return res.status(400).json({ message: 'Nickname already taken' });
            }
            
            nicknameToUpdate = nicknameStr;
        }
        
        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                nickname: nicknameToUpdate,
                avatar: avatar !== undefined ? avatar : undefined
            },
            select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true,
                phone: true,
                role: true,
                membershipType: true,
                createdAt: true
            }
        });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
