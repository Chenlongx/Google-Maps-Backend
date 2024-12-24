const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');  // 用于密码哈希校验


// MongoDB Atlas 连接字符串
const uri = "mongodb+srv://aa2231401652:4tvpB576PH2tI3mo@googlemaps.omgzf.mongodb.net/?retryWrites=true&w=majority&appName=GoogleMaps";

// 创建 MongoClient 实例
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// 定义 getUsers 函数来查询用户
exports.handler = async (event, context) => {
  try {
    // 连接 MongoDB
    await client.connect();
    console.log('MongoDB 连接成功');  // 打印连接成功信息

    // 获取数据库和集合
    const database = client.db("user_management");
    const regularUsersCollection = database.collection("regular_users");
    const trialUsersCollection = database.collection("trial_users");

    // 查询所有 regular_users 和 trial_users
    const regularUsers = await regularUsersCollection.find().toArray();
    const trialUsers = await trialUsersCollection.find().toArray();

    // 合并两个集合的数据
    const allUsers = [...regularUsers, ...trialUsers];

    // 如果没有找到用户，返回 404
    // if (allUsers.length === 0) {
    //   return {
    //     statusCode: 404,
    //     body: JSON.stringify({ message: '未找到任何用户' }),
    //   };
    // }

    // 返回用户数据
    return {
      statusCode: 200,
      body: JSON.stringify(allUsers),
    };
  } catch (error) {
    // 捕获错误并返回
    console.error("获取用户时出错:", error);  // 打印错误信息
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  } finally {
    // 确保 MongoClient 连接关闭
    await client.close();
  }
};
