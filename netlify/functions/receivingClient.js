const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');  // 用于密码哈希校验

// MongoDB Atlas 连接字符串
const uri = "mongodb+srv://aa2231401652:4tvpB576PH2tI3mo@googlemaps.omgzf.mongodb.net/?retryWrites=true&w=majority&appName=GoogleMaps";

// 创建 MongoClient 实例
const client = new MongoClient(uri);

// 定义 login 函数来验证用户
exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));  // 打印请求的 event 对象
    console.log('Received context:', JSON.stringify(context, null, 2));  // 打印 context 对象
  try {
    // 解析请求体中的 JSON 数据
    const { username, password } = JSON.parse(event.body);

    console.log("获取到前端的账号和密码" + username, password);

    // 连接 MongoDB
    await client.connect();
    console.log('MongoDB 连接成功');

    // 获取数据库和集合
    const database = client.db("user_management");
    const regularUsersCollection = database.collection("regular_users");
    const trialUsersCollection = database.collection("trial_users");

    // 查询用户，先查找 regular_users，再查找 trial_users
    let user = await regularUsersCollection.findOne({ username });
    if (!user) {
      user = await trialUsersCollection.findOne({ username });
    }

    // 如果没有找到用户，返回错误信息
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: '用户不存在' }),
        headers: {
            'Access-Control-Allow-Origin': '*', // 允许所有域访问
            'Content-Type': 'application/json', // 返回内容类型
          },
      };
    }

    // 使用 bcrypt 比对密码
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("数据库密码" + passwordMatch);
    if (!passwordMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: '密码错误' }),
        headers: {
            'Access-Control-Allow-Origin': '*', // 允许所有域访问
            'Content-Type': 'application/json', // 返回内容类型
          },
      };
    }

    // 登录成功，返回用户信息
    const userInfo = {
      username: user.username,
      userType: user.user_type,
      expiration_date: user.expiration_date,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user: userInfo }),
      headers: {
        'Access-Control-Allow-Origin': '*', // 允许所有域访问
        'Content-Type': 'application/json', // 返回内容类型
      },
    };

  } catch (error) {
    // 捕获错误并返回
    console.error("登录时出错:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        'Access-Control-Allow-Origin': '*', // 允许所有域访问
        'Content-Type': 'application/json', // 返回内容类型
      },
    };
  } finally {
    // 确保 MongoClient 连接关闭
    await client.close();
  }
};
