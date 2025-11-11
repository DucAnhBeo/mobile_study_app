const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://ducanh:8Dra2xj4fUBJu0kT@cluster0.qxcesms.mongodb.net/study_app_db?appName=Cluster0';

// Schemas using numeric _id (do NOT set `unique: true` on _id - MongoDB already enforces it)
const userSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
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

const discussionAnswerSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
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

// Models
const User = mongoose.model('User', userSchema);
const DiscussionQuestion = mongoose.model('DiscussionQuestion', discussionQuestionSchema);
const DiscussionAnswer = mongoose.model('DiscussionAnswer', discussionAnswerSchema);

async function dropCollectionIfExists(name) {
    const exists = await mongoose.connection.db.listCollections({ name }).next();
    if (exists) {
        try {
            await mongoose.connection.db.dropCollection(name);
            console.log(`✓ Dropped existing collection: ${name}`);
        } catch (err) {
            console.warn(`⚠️ Failed to drop collection ${name}:`, err.message);
            // try to drop problematic index `id_1` if present
            try {
                const col = mongoose.connection.db.collection(name);
                const indexes = await col.indexes();
                for (const idx of indexes) {
                    if (idx.name === 'id_1') {
                        await col.dropIndex('id_1');
                        console.log(`✓ Dropped index id_1 from ${name}`);
                        break;
                    }
                }
            } catch (e) {
                console.warn(`⚠️ Could not drop index id_1 on ${name}:`, e.message);
            }
        }
    }
}

// Setup function
async function setupDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✓ Connected to MongoDB!');
        console.log('Database:', mongoose.connection.db.databaseName);

        // Drop collections to remove old indexes (unique index on `id` causes duplicate-key on null)
        console.log('\n🗑️  Dropping existing collections (if any) to remove old indexes...');
        await dropCollectionIfExists('users');
        await dropCollectionIfExists('discussionquestions');
        await dropCollectionIfExists('discussionanswers');

        // Insert users with numeric _id
        console.log('\n👤 Creating users...');
        const usersData = [
            { id: 1, username: 'admin', password: '123456', fullName: 'Administrator' },
            { id: 2, username: 'testuser', password: '123456', fullName: 'Test User' },
            { id: 3, username: 'hocsinh_a', password: '123456', fullName: 'Học sinh A' },
            { id: 4, username: 'hocsinh_b', password: '123456', fullName: 'Học sinh B' },
            { id: 5, username: 'giaovien', password: '123456', fullName: 'Giáo viên' }
        ];
        await User.insertMany(usersData);
        console.log(`✓ Created ${usersData.length} users`);

        // Insert discussion questions with numeric _id
        console.log('\n❓ Creating discussion questions...');
        const questionsData = [
            { id: 1, user_id: 3, content: 'Tại sao khi ta nhìn vào gương, hình ảnh hiện ra lại bị ngược?' },
            { id: 2, user_id: 4, content: 'Làm thế nào để tính diện tích hình tròn khi chỉ biết chu vi?' },
            { id: 3, user_id: 3, content: 'Tại sao nước biển lại mặn mà nước sông lại ngọt?' },
            { id: 4, user_id: 4, content: 'Phân số 3/4 và 0.75 có giống nhau không? Tại sao?' },
            { id: 5, user_id: 3, content: 'Vì sao ban ngày trời sáng mà ban đêm lại tối?' }
        ];
        await DiscussionQuestion.insertMany(questionsData);
        console.log(`✓ Created ${questionsData.length} questions`);

        // Insert discussion answers with numeric _id
        console.log('\n💬 Creating discussion answers...');
        const answersData = [
            { id: 1, question_id: 1, user_id: 5, content: 'Khi ánh sáng chiếu vào gương phẳng, nó sẽ phản xạ theo quy luật phản xạ ánh sáng. Ảnh trong gương là ảnh ảo, có kích thước bằng vật nhưng bị đối xứng qua mặt gương.' },
            { id: 2, question_id: 1, user_id: 2, content: 'Đơn giản là vì gương tạo ra ảnh đối xứng. Nếu bạn giơ tay phải, ảnh trong gương sẽ giơ tay trái.' },
            { id: 3, question_id: 2, user_id: 5, content: 'Từ chu vi C, ta tính được bán kính r = C/(2π). Sau đó tính diện tích S = πr². Ví dụ: nếu chu vi = 12π thì r = 6, diện tích = 36π.' },
            { id: 4, question_id: 2, user_id: 1, content: 'Công thức: Chu vi = 2πr, nên r = Chu vi ÷ (2π). Rồi áp dụng S = πr².' },
            { id: 5, question_id: 3, user_id: 5, content: 'Nước biển mặn vì chứa nhiều muối khoáng, chủ yếu là NaCl. Trong khi nước sông được tạo thành từ nước mưa và nước ngầm nên ít muối hơn.' },
            { id: 6, question_id: 3, user_id: 4, content: 'Nước biển đã tích tụ muối qua hàng triệu năm từ việc xói mòn đất đá. Nước sông thì liên tục được làm mới bởi nước mưa.' },
            { id: 7, question_id: 4, user_id: 5, content: 'Có, 3/4 = 0.75. Đây là hai cách biểu diễn khác nhau của cùng một số. 3 chia 4 = 0.75.' },
            { id: 8, question_id: 4, user_id: 1, content: 'Phân số và số thập phân chỉ là cách viết khác nhau. 3/4 nghĩa là chia 3 cho 4, kết quả là 0.75.' },
            { id: 9, question_id: 5, user_id: 5, content: 'Do Trái Đất tự quay quanh trục của nó. Phần hướng về Mặt Trời sẽ có ban ngày, phần quay ra xa Mặt Trời sẽ có ban đêm.' },
            { id: 10, question_id: 5, user_id: 2, content: 'Trái Đất quay một vòng hết 24 giờ. Khi nơi ta ở quay về phía Mặt Trời thì sáng, quay ra xa thì tối.' }
        ];
        await DiscussionAnswer.insertMany(answersData);
        console.log(`✓ Created ${answersData.length} answers`);

        // Display summary
        console.log('\n📊 Database Summary:');
        console.log('═══════════════════════════════════════');

        const userCount = await User.countDocuments();
        const questionCount = await DiscussionQuestion.countDocuments();
        const answerCount = await DiscussionAnswer.countDocuments();

        console.log(`Users: ${userCount}`);
        console.log(`Questions: ${questionCount}`);
        console.log(`Answers: ${answerCount}`);

        // Display sample data
        console.log('\n📝 Sample Questions:');
        console.log('═══════════════════════════════════════');
        const sampleQuestions = await DiscussionQuestion.find()
            .sort({ created_at: -1 })
            .limit(3);

        for (let i = 0; i < sampleQuestions.length; i++) {
            const q = sampleQuestions[i];
            // use numeric `id` field instead of MongoDB's `_id`
            const user = await User.findOne({ id: q.user_id });
            console.log(`${i + 1}. [ID: ${q.id}] ${q.content}`);
            console.log(`   Author: ${user ? user.fullName : 'Unknown'} (@${user ? user.username : 'unknown'})`);
            console.log(`   Created: ${q.created_at.toLocaleString()}`);
            console.log('');
        }

        console.log('✅ Database setup completed successfully!\n');

    } catch (error) {
        console.error('❌ Error setting up database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed.');
        process.exit(0);
    }
}

console.log('🚀 Starting MongoDB database setup...');
console.log('═══════════════════════════════════════\n');
setupDatabase();
