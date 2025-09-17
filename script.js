const API_KEY = "sk-1234uvwx5678abcd1234uvwx5678abcd1234uvwx"; // بهتره توی سرور بذاری

async function send() {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");
  const text = input.value.trim();
  if (!text) return;

  chat.innerHTML += `<div class="msg user">👤 ${text}</div>`;
  input.value = "";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: text }]
    })
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "خطا در پاسخ";
  chat.innerHTML += `<div class="msg ai">🤖 ${reply}</div>`;
  chat.scrollTop = chat.scrollHeight;
}
