const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');  // 用于密码哈希校验
const jwt = require('jsonwebtoken'); // 用于生成 JWT

require('dotenv').config();  // 加载 .env 文件中的环境变量


// MongoDB Atlas 连接字符串
const uri = "mongodb+srv://aa2231401652:4tvpB576PH2tI3mo@googlemaps.omgzf.mongodb.net/?retryWrites=true&w=majority&appName=GoogleMaps";


exports.handler = async function(event, context) {
    // 处理预检请求 (OPTIONS 请求)
    if (event.httpMethod === 'OPTIONS') {
        return {
        statusCode: 204,
        body: '',
        headers: {
            "Access-Control-Allow-Origin": "*",  // 允许所有来源的请求
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",  // 允许的请求方法
            "Access-Control-Allow-Headers": "Content-Type",  // 允许的请求头
        },
        };
    }

    // 解析请求体中的 JSON
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "用户名和密码不能为空" }),
        headers: {
            "Access-Control-Allow-Origin": "*",  // 允许所有来源的请求
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",  // 允许的请求方法
            "Access-Control-Allow-Headers": "Content-Type"  // 允许的请求头
          }
      };
    }

    try {
      // 创建 MongoClient 实例
      const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

      // 连接到 MongoDB
      await client.connect();

      const database = client.db('user_management');  // 选择数据库
      const collection = database.collection('administrator');  // 选择集合

      // 查询管理员用户
      const user = await collection.findOne({ username });

      if (!user) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "用户不存在" }),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        };
      }

      // 使用 bcrypt 校验密码
      console.log("提交的密码" + password, "数据库中的密码" + user.password);
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: "密码错误" }),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        };
      }

      // 生成 JWT Token
      const payload = {
        username: user.username,
        user_type: user.user_type,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });  // 使用从 .env 文件中加载的 JWT 密钥

      // 检查数据库是否已有 token，如果有，则替换
      const updateResult = await collection.updateOne(
          { username },
          { $set: { token } }  // 更新用户的 token
      );

      // 检查更新操作是否成功
      if (updateResult.modifiedCount === 0) {
        // 如果更新失败，说明没有修改任何记录（可能是 token 本身没变）
        console.log("Token 更新失败");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Token 更新失败" }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        };
      }

      // 返回用户信息，登录成功
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "登录成功", user: { username: user.username, user_type: user.user_type },
        token,  // 返回 token
      }),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type"
          }
      };

    } catch (err) {
      console.error("数据库连接错误:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "数据库连接错误" }),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type"
          }
      };
    }
  };