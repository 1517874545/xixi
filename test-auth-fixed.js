// 修复的认证API测试脚本
const BASE_URL = 'http://localhost:3000/api/auth';

// 使用gmail邮箱格式，Supabase通常接受
const TEST_EMAIL = `test${Date.now()}@gmail.com`;
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
    
    console.log('   注册邮箱:', TEST_EMAIL);
    
    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const registerResult = await registerResponse.json();
    console.log('   响应状态:', registerResponse.status);
    
    if (registerResponse.ok) {
      console.log('✅ 注册成功');
      console.log('   用户ID:', registerResult.user?.id);
    } else {
      console.log('❌ 注册失败:', registerResult.error);
      
      // 如果用户已存在，尝试登录
      if (registerResult.error?.includes('already registered')) {
        console.log('   用户已存在，尝试登录...');
        await testLogin();
        return;
      }
      return;
    }

    // 2. 测试登录
    console.log('\n2. 测试用户登录...');
    await testLogin();

    console.log('\n🎉 认证API测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

async function testLogin() {
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
  
  if (loginResponse.ok) {
    console.log('✅ 登录成功');
    console.log('   用户ID:', loginResult.user?.id);
    
    // 测试获取用户资料
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
      
      if (profileResponse.ok) {
        console.log('✅ 获取资料成功');
        console.log('   用户名:', profileResult.user?.profile?.username);
      } else {
        console.log('❌ 获取资料失败:', profileResult.error);
      }
    }
  } else {
    console.log('❌ 登录失败:', loginResult.error);
  }
}

// 运行测试
testAuth().catch(console.error);