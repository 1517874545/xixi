// 简单的API测试脚本
const fetch = require('node-fetch');

async function testAPI() {
  console.log('Testing API endpoints...\n');

  // 测试获取所有设计
  try {
    console.log('1. Testing GET /api/designs...');
    const response = await fetch('http://localhost:3002/api/designs');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Number of designs:', data.designs ? data.designs.length : 'N/A');
    console.log('');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('');
  }

  // 测试获取公开设计
  try {
    console.log('2. Testing GET /api/designs?isPublic=true...');
    const response = await fetch('http://localhost:3002/api/designs?isPublic=true');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Number of public designs:', data.designs ? data.designs.length : 'N/A');
    console.log('');
  } catch (error) {
    console.log('Error:', error.message);
    console.log('');
  }

  // 测试创建新设计
  try {
    console.log('3. Testing POST /api/designs...');
    const newDesign = {
      title: 'Test Design',
      user_id: 'test-user-123',
      components: {
        body: '1',
        ears: '20',
        eyes: '40',
        nose: '60',
        mouth: '80',
        accessories: '109',
        background: '120',
        bodyColor: '#fbbf24'
      },
      is_public: false
    };

    const response = await fetch('http://localhost:3002/api/designs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newDesign),
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Created design ID:', data.design ? data.design.id : 'N/A');
    console.log('');

    // 如果创建成功，测试获取单个设计
    if (data.design && data.design.id) {
      console.log('4. Testing GET /api/designs/[id]...');
      const getResponse = await fetch(`http://localhost:3002/api/designs/${data.design.id}`);
      const getData = await getResponse.json();
      console.log('Status:', getResponse.status);
      console.log('Retrieved design title:', getData.design ? getData.design.title : 'N/A');
      console.log('');
    }
  } catch (error) {
    console.log('Error:', error.message);
    console.log('');
  }

  console.log('API test completed.');
}

// 如果直接运行此脚本
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };