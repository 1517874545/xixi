// 清理本地存储中的示例数据脚本
// 在浏览器控制台中运行此脚本

function cleanupExampleData() {
  console.log('开始清理示例数据...');
  
  // 清理设计数据
  const savedDesigns = JSON.parse(localStorage.getItem("petcraft_designs") || "[]");
  console.log('当前设计数据数量:', savedDesigns.length);
  
  // 过滤掉示例设计（根据示例设计的特征）
  const filteredDesigns = savedDesigns.filter(design => {
    // 示例设计通常有特定的ID模式或标题
    const isExampleDesign = 
      design.id?.includes('example') ||
      design.id?.includes('design1') ||
      design.id?.includes('design2') ||
      design.id?.includes('design3') ||
      design.title?.includes('Sunny the Cat') ||
      design.title?.includes('Blue Buddy') ||
      design.title?.includes('Pink Princess') ||
      design.title?.includes('Example Pet Design');
    
    return !isExampleDesign;
  });
  
  console.log('清理后设计数据数量:', filteredDesigns.length);
  localStorage.setItem("petcraft_designs", JSON.stringify(filteredDesigns));
  
  // 清理点赞数据
  const savedLikes = JSON.parse(localStorage.getItem("petcraft_likes") || "[]");
  console.log('当前点赞数据数量:', savedLikes.length);
  
  // 过滤掉示例设计的点赞
  const filteredLikes = savedLikes.filter(likeId => {
    const isExampleLike = 
      likeId?.includes('example') ||
      likeId?.includes('design1') ||
      likeId?.includes('design2') ||
      likeId?.includes('design3');
    
    return !isExampleLike;
  });
  
  console.log('清理后点赞数据数量:', filteredLikes.length);
  localStorage.setItem("petcraft_likes", JSON.stringify(filteredLikes));
  
  // 清理评论数据
  const savedComments = JSON.parse(localStorage.getItem("petcraft_comments") || "[]");
  console.log('当前评论数据数量:', savedComments.length);
  
  // 过滤掉示例设计的评论
  const filteredComments = savedComments.filter(comment => {
    const isExampleComment = 
      comment.design_id?.includes('example') ||
      comment.design_id?.includes('design1') ||
      comment.design_id?.includes('design2') ||
      comment.design_id?.includes('design3');
    
    return !isExampleComment;
  });
  
  console.log('清理后评论数据数量:', filteredComments.length);
  localStorage.setItem("petcraft_comments", JSON.stringify(filteredComments));
  
  console.log('示例数据清理完成！');
  console.log('请刷新页面查看效果。');
}

// 运行清理函数
cleanupExampleData();