// 简单的认证API测试脚本
const BASE_URL = 'http://localhost:3000/api/auth';

// 使用简单的邮箱格式
const TEST_EMAIL = `test${Date.now()}@test.com`;
const TEST_PASSWORD = 'testpassword123';

async function testAuth() {
  console.log('🚀 开始测试认证API...\n');
  
  try {
    // 1. 测试注册
    console.log('1. 测试用户注册...');
    const registerData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      username: 'testuser'
    };
    
    console.log('   注册数据:', JSON.stringify(registerData, null, 2));
    
    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const registerResult = await registerResponse.json();
    console.log('   响应状态:', registerResponse.status);
    console.log('   响应数据:', JSON.stringify(registerResult, null, 2));
    
    if (registerResponse.ok) {
      console.log('✅ 注册成功');
    } else {
      console.log('❌ 注册失败');
      return;
    }

    // 2. 测试登录
    console.log('\n2. 测试用户登录...');
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const loginResult = await loginResponse.json();
    console.log('   响应状态:', loginResponse.status);
    console.log('   响应数据:', JSON.stringify(loginResult, null, 2));
    
    if (loginResponse.ok) {
      console.log('✅ 登录成功');
      
      // 3. 测试获取用户资料
      const authToken = loginResult.session?.access_token;
      if (authToken) {
        console.log('\n3. 测试获取用户资料...');
        const profileResponse = await fetch(`${BASE_URL}/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        const profileResult = await profileResponse.json();
        console.log('   响应状态:', profileResponse.status);
        console.log('   响应数据:', JSON.stringify(profileResult, null, 2));
        
        if (profileResponse.ok) {
          console.log('✅ 获取资料成功');
        }
      }
    }

    console.log('\n🎉 认证API测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

// 运行测试
testAuth().catch(console.error);