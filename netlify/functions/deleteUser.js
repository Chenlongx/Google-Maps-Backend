const { MongoClient, ObjectId } = require('mongodb');  // 引入 ObjectId


// MongoDB Atlas 连接字符串
const uri = "mongodb+srv://aa2231401652:4tvpB576PH2tI3mo@googlemaps.omgzf.mongodb.net/?retryWrites=true&w=majority&appName=GoogleMaps";

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

exports.handler = async function (event, context) {
    // 处理预检请求 (OPTIONS 请求)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: '',
        };
    }

    try {
        // 解析请求体
        const { userIds } = JSON.parse(event.body);

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "无效的用户 ID 列表" }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            };
        }

        // 连接到 MongoDB
        await client.connect();
        console.log("成功连接到 MongoDB");

        // 获取数据库和集合
        const database = client.db("user_management");
        const regularUsersCollection = database.collection("regular_users");
        const trialUsersCollection = database.collection("trial_users");



        // 删除用户（同时处理两个集合）
        const deleteRegularUsers = regularUsersCollection.deleteMany({
            _id: { $in: userIds.map(id => new ObjectId(id)) },  // 使用 ObjectId 来处理 ID 转换
        });

        const deleteTrialUsers = trialUsersCollection.deleteMany({
            _id: { $in: userIds.map(id => new ObjectId(id)) },  // 使用 ObjectId 来处理 ID 转换
        });

        // 执行删除操作
        const [regularResult, trialResult] = await Promise.all([deleteRegularUsers, deleteTrialUsers]);

        const totalDeleted = (regularResult.deletedCount || 0) + (trialResult.deletedCount || 0);

        if (totalDeleted === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "未找到匹配的用户进行删除" }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            };
        }

        // 返回成功响应
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: `成功删除 ${totalDeleted} 个用户` }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };

    } catch (error) {
        console.error("删除用户时出错:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "删除用户时发生错误", error: error.message }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    } finally {
        // 确保关闭连接
        await client.close();
    }
};