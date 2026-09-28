// 听写模拟：使用浏览器内置语音合成，不接入任何第三方服务
export function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = /^[a-zA-Z0-9 ]+$/.test(text) ? "en-US" : "zh-CN";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeak(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
