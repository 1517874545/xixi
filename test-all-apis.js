// 完整的API连通性测试脚本
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAllAPIs() {
  console.log('开始测试所有API端点连通性...\n');

  // 测试1: 获取组件API
  try {
    console.log('1. 测试 GET /api/components...');
    const response = await fetch('http://localhost:3000/api/components');
    const data = await response.json();
    console.log('状态:', response.status);
    console.log('组件数量:', data.components ? data.components.length : 'N/A');
    console.log('');
  } catch (error) {
    console.log('错误:', error.message);
    console.log('');
  }

  // 测试2: 获取设计API
  try {
    console.log('2. 测试 GET /api/designs...');
    const response = await fetch('http://localhost:3000/api/designs');
    const data = await response.json();
    console.log('状态:', response.status);
    console.log('设计数量:', data.designs ? data.designs.length : 'N/A');
    console.log('');
  } catch (error) {
    console.log('错误:', error.message);
    console.log('');
  }

  // 测试3: 获取公开设计
  try {
    console.log('3. 测试 GET /api/designs?isPublic=true...');
    const response = await fetch('http://localhost:3000/api/designs?isPublic=true');
    const data = await response.json();
    console.log('状态:', response.status);
    console.log('公开设计数量:', data.designs ? data.designs.length : 'N/A');
    console.log('');
  } catch (error) {
    console.log('错误:', error.message);
    console.log('');
  }

  // 测试4: 点赞API
  try {
    console.log('4. 测试 GET /api/likes...');
    const response = await fetch('http://localhost:3000/api/likes?designId=test-design&userId=test-user');
    const data = await response.json();
    console.log('状态:', response.status);
    console.log('点赞状态:', data.liked !== undefined ? data.liked : 'N/A');
    console.log('');
  } catch (error) {
    console.log('错误:', error.message);
    console.log('');
  }

  // 测试5: 评论API
  try {
    console.log('5. 测试 GET /api/comments...');
    const response = await fetch('http://localhost:3000/api/comments?designId=test-design');
    const data = await response.json();
    console.log('状态:', response.status);
    console.log('评论数量:', data.comments ? data.comments.length : 'N/A');
    console.log('');
  } catch (error) {
    console.log('错误:', error.message);
    console.log('');
  }

  // 测试6: 创建新设计
  try {
    console.log('6. 测试 POST /api/designs...');
    const newDesign = {
      title: '测试设计',
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

    const response = await fetch('http://localhost:3000/api/designs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newDesign),
    });
    
    const data = await response.json();
    console.log('状态:', response.status);
    console.log('创建的设计ID:', data.design ? data.design.id : 'N/A');
    console.log('');

    // 如果创建成功，测试获取单个设计
    if (data.design && data.design.id) {
      console.log('7. 测试 GET /api/designs/[id]...');
      const getResponse = await fetch(`http://localhost:3000/api/designs/${data.design.id}`);
      const getData = await getResponse.json();
      console.log('状态:', getResponse.status);
      console.log('获取的设计标题:', getData.design ? getData.design.title : 'N/A');
      console.log('');
    }
  } catch (error) {
    console.log('错误:', error.message);
    console.log('');
  }

  console.log('所有API测试完成。');
}

// 如果直接运行此脚本
if (require.main === module) {
  testAllAPIs();
}

module.exports = { testAllAPIs };