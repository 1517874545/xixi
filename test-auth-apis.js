// 测试配置
const BASE_URL = 'http://localhost:3000/api/auth';
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

let authToken = '';

async function testAuthAPIs() {
  console.log('🚀 开始测试Supabase用户认证API...\n');

  try {
    // 1. 测试用户注册
    console.log('1. 测试用户注册...');
    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        username: 'testuser'
      }),
    });

    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ 注册成功');
      console.log('   用户ID:', registerData.user?.id);
      console.log('   邮箱:', registerData.user?.email);
      
      // 保存认证token
      if (registerData.session?.access_token) {
        authToken = registerData.session.access_token;
        console.log('   Token已获取');
      }
    } else {
      console.log('❌ 注册失败:', registerData.error);
      // 如果用户已存在，尝试登录
      if (registerData.error?.includes('already registered')) {
        console.log('   用户已存在，尝试登录...');
        await testLogin();
      }
      return;
    }

    // 2. 测试用户登录
    console.log('\n2. 测试用户登录...');
    await testLogin();

    // 3. 测试获取用户资料
    console.log('\n3. 测试获取用户资料...');
    const profileResponse = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const profileData = await profileResponse.json();
    
    if (profileResponse.ok) {
      console.log('✅ 获取用户资料成功');
      console.log('   用户名:', profileData.user?.profile?.username);
      console.log('   邮箱:', profileData.user?.email);
    } else {
      console.log('❌ 获取用户资料失败:', profileData.error);
    }

    // 4. 测试更新用户资料
    console.log('\n4. 测试更新用户资料...');
    const updateResponse = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'updated_testuser',
        avatar_url: 'https://example.com/avatar.jpg'
      }),
    });

    const updateData = await updateResponse.json();
    
    if (updateResponse.ok) {
      console.log('✅ 更新用户资料成功');
      console.log('   新用户名:', updateData.user?.profile?.username);
    } else {
      console.log('❌ 更新用户资料失败:', updateData.error);
    }

    // 5. 测试用户登出
    console.log('\n5. 测试用户登出...');
    const logoutResponse = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const logoutData = await logoutResponse.json();
    
    if (logoutResponse.ok) {
      console.log('✅ 登出成功');
    } else {
      console.log('❌ 登出失败:', logoutData.error);
    }

    console.log('\n🎉 所有认证API测试完成！');

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

  const loginData = await loginResponse.json();
  
  if (loginResponse.ok) {
    console.log('✅ 登录成功');
    console.log('   用户ID:', loginData.user?.id);
    
    // 保存认证token
    if (loginData.session?.access_token) {
      authToken = loginData.session.access_token;
      console.log('   Token已获取');
    }
  } else {
    console.log('❌ 登录失败:', loginData.error);
  }
}

// 运行测试
testAuthAPIs().catch(console.error);