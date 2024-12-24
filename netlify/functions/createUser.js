const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');  // 用于密码哈希处理

// MongoDB 连接 URI
const uri = "mongodb+srv://aa2231401652:4tvpB576PH2tI3mo@googlemaps.omgzf.mongodb.net/?retryWrites=true&w=majority&appName=GoogleMaps";

// 计算到期日期的函数
function calculateExpirationDate(timeLimit, currentDate) {
    let expirationDate;
    console.log('计算过期日期，当前时间限制:', timeLimit); // 添加调试信息

    switch (timeLimit) {
        case '1day':
            expirationDate = new Date(currentDate);
            expirationDate.setDate(expirationDate.getDate() + 1); // 加一天
            break;
        case '1week':
            expirationDate = new Date(currentDate);
            expirationDate.setDate(expirationDate.getDate() + 7); // 加一周
            break;
        case '1month':
            expirationDate = new Date(currentDate);
            expirationDate.setMonth(expirationDate.getMonth() + 1); // 加一月
            break;
        case '1year':
            expirationDate = new Date(currentDate);
            expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 加一年
            break;
        case 'permanent':
            expirationDate = null; // 永久用户没有到期时间
            break;
        default:
            expirationDate = null;
    }

    return expirationDate;
}

// Netlify 函数处理
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: '只支持 POST 请求' })
        };
    }

    // 解析请求体
    const { username, password, userType, timeLimit } = JSON.parse(event.body);

    if (!username || !password || !userType || !timeLimit) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: '用户名、密码和用户类型不能为空' })
        };
    }
    console.log('用户名:' + username, '密码' + password, "用户类型" + userType, "时间限制:" + timeLimit);

    try {
        // 创建 MongoClient 实例
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        // 选择数据库和集合
        const database = client.db('user_management');

        // 根据用户类型选择对应的集合
        let collection;
        if (userType === "trial") {
            // 正常用户
            collection = database.collection('trial_users');
        } else {
            // 试用用户
            collection = database.collection('regular_users');
        }

        // 检查用户名是否已经存在
        const existingUser = await collection.findOne({ username });
        if (existingUser) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: '用户名已存在' })
            };
        }

        // 对密码进行哈希处理
        const hashedPassword = await bcrypt.hash(password, 10);

        // 获取当前时间
        const currentDate = new Date();

        // 计算到期时间
        const expirationDate = calculateExpirationDate(timeLimit, currentDate);
        console.log(expirationDate)

        if (!expirationDate && timeLimit !== 'permanent') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: '无效的时间限制' })
            };
        }

        console.log('最终的到期时间:', expirationDate); // 添加调试信息

        // 创建新用户
        const newUser = {
            username,
            password: hashedPassword,
            user_type: userType,
            expiration_date: expirationDate,  // 保存到期时间
            created_at: currentDate,
            updated_at: currentDate
        };

        // 插入新用户到数据库
        await collection.insertOne(newUser);

        // 关闭数据库连接
        await client.close();

        // 返回成功响应
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        console.error('添加用户失败:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: '服务器错误，请稍后再试' })
        };
    }
};
