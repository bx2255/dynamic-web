// 页面加载时执行
document.addEventListener("DOMContentLoaded", function () {
  loadProjects();

  // 表单提交事件
  const form = document.getElementById("projectForm");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const year = document.getElementById("year").value;
    const description = document.getElementById("description").value;

    // 发送 POST 请求
    await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        year: year,
        description: description,
      }),
    });

    form.reset();
    loadProjects();
  });
});

// 获取并显示项目
async function loadProjects() {
  const response = await fetch("/api/projects");
  const data = await response.json();

  const list = document.getElementById("list");
  list.innerHTML = "";

  for (let i = 0; i < data.projects.length; i++) {
    const project = data.projects[i];

    const div = document.createElement("div");
    div.innerHTML =
      "<h3>" +
      project.title +
      "</h3>" +
      "<p>" +
      project.year +
      "</p>" +
      "<p>" +
      project.description +
      "</p>" +
      "<hr>";

    list.appendChild(div);
  }
};
