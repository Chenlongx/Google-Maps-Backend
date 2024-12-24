const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');  // 用于密码哈希处理

const uri = "mongodb+srv://aa2231401652:4tvpB576PH2tI3mo@googlemaps.omgzf.mongodb.net/?retryWrites=true&w=majority&appName=GoogleMaps";



const client = new MongoClient(uri);

// 直接导出一个 handler 函数
exports.handler = async function(event, context) {
    // 打印出从前端传递过来的请求体内容，查看请求数据
    console.log('收到的请求体:', event.body);

    // 解析请求体
    const { _id, username, password, user_type, created_at, expiration_date, status } = JSON.parse(event.body);
    // 检查数据是否完整
    if (!username || !user_type || !created_at || !expiration_date) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: '缺少必需的字段' })
        };
    }

    try {
        // 连接到数据库
        await client.connect();
        const database = client.db("user_management");

        // 根据 user_type 选择集合
        let usersCollection;
        // if (user_type === 'regular') {
        //     usersCollection = database.collection("regular_users");
        // } else if (user_type === 'trial') {
        //     usersCollection = database.collection("trial_users");
        // } else {
        //     return {
        //         statusCode: 400,
        //         body: JSON.stringify({ message: '无效的 user_type' })
        //     };
        // }
        const regularUsersCollection = database.collection("regular_users");
        const trialUsersCollection = database.collection("trial_users");


        // 判断 _id 是否是有效的 ObjectId
        let objectId;
        if (ObjectId.isValid(_id)) {
            objectId = new ObjectId(_id);  // 如果是有效的 ObjectId 字符串，则转换为 ObjectId 类型
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: '无效的 _id 值' })
            };
        }
        console.log("objectId的值" + objectId)
        // 更新用户数据时，只在密码被提供时进行哈希处理并更新密码
        const updateData = {
            username,
            user_type,
            created_at,
            expiration_date,
            status
        };

        // 如果密码字段存在且不为空，则哈希密码并更新
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);  // 对密码进行哈希处理
        }

        // 分别更新两个集合
        const resultRegular = await regularUsersCollection.updateOne(
            { _id: objectId },  // 使用转换后的 ObjectId
            {
                $set: updateData
            }
        );

        const resultTrial = await trialUsersCollection.updateOne(
            { _id: objectId },  // 使用转换后的 ObjectId
            {
                $set: updateData
            }
        );
        // // 如果密码被提供，进行哈希处理
        // let hashedPassword = password;
        // if (password) {
        //     hashedPassword = await bcrypt.hash(password, 10);
        // }

        // // 更新用户数据
        // const result = await usersCollection.updateOne(
        //     { _id: new ObjectId(_id) },  // 使用 ObjectId 来创建 _id
        //     {
        //         $set: {
        //             username,
        //             password: hashedPassword,
        //             user_type,
        //             created_at,
        //             expiration_date,
        //             status
        //         }
        //     },
        //     { upsert: true }  // 如果没有找到用户，自动创建一个新的文档
        // );

        // 如果没有找到用户，返回错误
        if (resultRegular.matchedCount === 0 && resultTrial.matchedCount === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: '未找到指定的用户' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: '用户信息已更新' })
        };

    } catch (error) {
        console.error('更新用户时出错:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: '更新用户信息失败' })
        };
    } finally {
        await client.close();
    }
}