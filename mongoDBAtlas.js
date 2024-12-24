const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');  // 用于密码哈希处理

async function main() {
    // MongoDB 连接 URI
    const uri = "mongodb+srv://aa2231401652:4tvpB576PH2tI3mo@googlemaps.omgzf.mongodb.net/?retryWrites=true&w=majority&appName=GoogleMaps";

    // 创建一个新的 MongoClient
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // 连接到 MongoDB 服务器
        await client.connect();

        console.log("成功连接到服务器");

        // 选择数据库
        const database = client.db("user_management");

        // 选择集合
        const regularUsersCollection = database.collection("administrator");

        // 创建一个新的用户对象，先对密码进行哈希处理
        const password = "abcd1234"; // 明文密码
        const hashedPassword = await bcrypt.hash(password, 10); // 将密码哈希处理，第二个参数是盐的强度

        const newAdmin = {
            username: "admin",  // 管理员账号
            password: hashedPassword,  // 保存哈希后的密码
            user_type: "administrator",  // 管理员用户
            created_at: new Date(),  // 当前时间
            updated_at: new Date()   // 当前时间
        };

        // 向集合插入新用户文档
        await regularUsersCollection.insertOne(newAdmin);
        console.log("插入一名管理员用户");

    } finally {
        // 确保在完成后关闭连接
        await client.close();
    }
}

main().catch(console.error);