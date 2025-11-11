const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = 3001; 

// Google OAuth2 client
const client = new OAuth2Client('531094183499-pndtrdb9legj910hkpd18ibq2mcic9cs.apps.googleusercontent.com');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://ducanh:8Dra2xj4fUBJu0kT@cluster0.qxcesms.mongodb.net/study_app_db?appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB database!');
    console.log('Database:', mongoose.connection.db.databaseName);
})
.catch((err) => {
    console.error('MongoDB connection failed:', err);
});

// MongoDB Schemas
const userSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    password: {
        type: String,
        required: true,
        maxlength: 255
    },
    fullName: {
        type: String,
        maxlength: 200
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

const discussionQuestionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    user_id: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const discussionAnswerSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    question_id: {
        type: Number,
        required: true
    },
    user_id: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before save
userSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Models
const User = mongoose.model('User', userSchema);
const DiscussionQuestion = mongoose.model('DiscussionQuestion', discussionQuestionSchema);
const DiscussionAnswer = mongoose.model('DiscussionAnswer', discussionAnswerSchema);

// helper: get next numeric id for a model
async function getNextId(Model) {
    const doc = await Model.findOne().sort({ id: -1 }).select('id').lean();
    return doc && doc.id ? doc.id + 1 : 1;
}

// ============ API ENDPOINTS ============

// Test endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Study App Backend API với MongoDB',
        database: 'MongoDB',
        port: PORT
    });
});

// ============ USER ENDPOINTS ============

// Register user
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, fullName } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username và password là bắt buộc'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username đã tồn tại'
            });
        }

        // Create new user with numeric id
        const nextUserId = await getNextId(User);
        const newUser = new User({
            id: nextUserId,
            username,
            password,
            fullName: fullName || null
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            user: {
                id: newUser.id,
                username: newUser.username,
                fullName: newUser.fullName
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký',
            error: error.message
        });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username và password là bắt buộc'
            });
        }

        const user = await User.findOne({ username, password });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username hoặc password không đúng'
            });
        }

        console.log('=== LOGIN RESPONSE ===');
        console.log('User from DB:', { id: user.id, username: user.username, fullName: user.fullName });
        console.log('=====================');

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập',
            error: error.message
        });
    }
});

// Get user by ID
app.get('/api/users/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (Number.isNaN(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }

        const user = await User.findOne({ id: userId }).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Update user profile
app.put('/api/profile/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const { username, password, full_name } = req.body;

        if (Number.isNaN(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username và password là bắt buộc'
            });
        }

        // Check if user exists
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Check if new username is already taken by another user
        if (username !== user.username) {
            const existingUser = await User.findOne({ username, id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username đã tồn tại'
                });
            }
        }

        // Update user
        user.username = username;
        user.password = password;
        user.fullName = full_name || user.fullName;
        user.updated_at = Date.now();

        await user.save();

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin',
            error: error.message
        });
    }
});

// ============ DISCUSSION ENDPOINTS ============

// Get all questions
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await DiscussionQuestion.find().sort({ created_at: -1 });

        const formattedQuestions = await Promise.all(questions.map(async (q) => {
            // Get author info
            const user = await User.findOne({ id: q.user_id });

            // Get answers for this question
            const answers = await DiscussionAnswer.find({ question_id: q.id }).sort({ created_at: 1 });

            // Format answers with user info
            const formattedAnswers = await Promise.all(answers.map(async (a) => {
                const answerUser = await User.findOne({ id: a.user_id });
                return {
                    id: a.id,
                    content: a.content,
                    author: answerUser ? answerUser.username : 'unknown',
                    created_at: a.created_at
                };
            }));

            return {
                id: q.id,
                content: q.content,
                author: user ? user.username : 'unknown',  // Đổi từ username thành author
                created_at: q.created_at,
                answers: formattedAnswers  // Thêm answers
            };
        }));

        res.json({
            success: true,
            questions: formattedQuestions
        });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Create question
app.post('/api/questions', async (req, res) => {
    try {
        const { userId, content } = req.body;

        if (!userId || !content) {
            return res.status(400).json({
                success: false,
                message: 'UserId và content là bắt buộc'
            });
        }

        const nextQId = await getNextId(DiscussionQuestion);
        const newQuestion = new DiscussionQuestion({
            id: nextQId,
            user_id: parseInt(userId, 10),
            content
        });

        await newQuestion.save();

        res.status(201).json({
            success: true,
            message: 'Tạo câu hỏi thành công',
            questionId: newQuestion.id
        });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Get answers for a question
app.get('/api/questions/:questionId/answers', async (req, res) => {
    try {
        const questionId = parseInt(req.params.questionId, 10);
        if (Number.isNaN(questionId)) {
            return res.status(400).json({ success: false, message: 'Invalid questionId' });
        }

        const answers = await DiscussionAnswer.find({ question_id: questionId }).sort({ created_at: 1 });

        const formattedAnswers = await Promise.all(answers.map(async (a) => {
            const user = await User.findOne({ id: a.user_id });
            return {
                id: a.id,
                question_id: a.question_id,
                content: a.content,
                username: user ? user.username : 'unknown',
                fullName: user ? user.fullName : 'Unknown',
                created_at: a.created_at
            };
        }));

        res.json({
            success: true,
            answers: formattedAnswers
        });
    } catch (error) {
        console.error('Get answers error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Create answer
app.post('/api/answers', async (req, res) => {
    try {
        const { questionId, userId, content } = req.body;

        if (!questionId || !userId || !content) {
            return res.status(400).json({
                success: false,
                message: 'QuestionId, userId và content là bắt buộc'
            });
        }

        const nextAId = await getNextId(DiscussionAnswer);
        const newAnswer = new DiscussionAnswer({
            id: nextAId,
            question_id: parseInt(questionId, 10),
            user_id: parseInt(userId, 10),
            content
        });

        await newAnswer.save();

        res.status(201).json({
            success: true,
            message: 'Tạo câu trả lời thành công',
            answerId: newAnswer.id
        });
    } catch (error) {
        console.error('Create answer error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Delete question
app.delete('/api/questions/:questionId', async (req, res) => {
    try {
        const questionId = parseInt(req.params.questionId, 10);
        const userId = parseInt(req.query.user_id, 10);

        if (Number.isNaN(questionId) || Number.isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid questionId or userId'
            });
        }

        // Find question
        const question = await DiscussionQuestion.findOne({ id: questionId });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy câu hỏi'
            });
        }

        // Check if user owns the question
        if (question.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa câu hỏi này'
            });
        }

        // Delete all answers for this question
        await DiscussionAnswer.deleteMany({ question_id: questionId });

        // Delete the question
        await DiscussionQuestion.deleteOne({ id: questionId });

        res.json({
            success: true,
            message: 'Đã xóa câu hỏi thành công'
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Google Sign-In
app.post('/api/auth/google', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'idToken là bắt buộc'
            });
        }

        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: '531094183499-pndtrdb9legj910hkpd18ibq2mcic9cs.apps.googleusercontent.com'
        });

        const payload = ticket.getPayload();
        const googleId = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];

        // Check if user exists
        let user = await User.findOne({ username: email });

        if (!user) {
            // Create new user with numeric id
            const nextUserId = await getNextId(User);
            user = new User({
                id: nextUserId,
                username: email,
                password: googleId, // Use Google ID as password
                fullName: name
            });
            await user.save();
        }

        res.json({
            success: true,
            message: 'Đăng nhập Google thành công',
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xác thực Google',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server MongoDB đang chạy tại http://localhost:${PORT}`);
});
