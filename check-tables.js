// 检查Supabase表结构的脚本
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kjdruhhlbuxoywovgbgh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZHJ1aGhsYnV4b3l3b3ZnYmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkzNTIsImV4cCI6MjA3NjUwNTM1Mn0.uTb0xjetj0nVaY-4Dj5bfZZcXIxpxEe__fwgV-7vj_s'
);

async function checkTables() {
  console.log('开始检查Supabase表结构...\n');
  
  // 尝试查询已知的表
  const tablesToCheck = ['users', 'designs', 'components', 'likes', 'comments'];
  
  for (const tableName of tablesToCheck) {
    try {
      console.log(`检查表: ${tableName}`);
      
      // 尝试获取少量数据来检查表是否存在
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ 表 ${tableName} 不存在\n`);
        } else {
          console.log(`⚠️ 表 ${tableName} 查询错误: ${error.message}\n`);
        }
      } else {
        console.log(`✅ 表 ${tableName} 存在`);
        
        // 尝试获取表结构信息
        if (data && data.length > 0) {
          console.log('字段示例:');
          const sampleRow = data[0];
          Object.keys(sampleRow).forEach(key => {
            console.log(`  - ${key}: ${typeof sampleRow[key]} (示例值: ${JSON.stringify(sampleRow[key]).substring(0, 50)})`);
          });
        }
        console.log('');
      }
    } catch (err) {
      console.log(`❌ 检查表 ${tableName} 时出错: ${err.message}\n`);
    }
  }
  
  // 尝试获取所有表名
  try {
    console.log('尝试获取所有表名...');
    
    // 使用SQL查询获取所有表
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('无法查询information_schema表');
    } else if (tablesData && tablesData.length > 0) {
      console.log('数据库中的所有表:');
      tablesData.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
  } catch (err) {
    console.log('获取所有表名失败');
  }
}

checkTables().catch(console.error);