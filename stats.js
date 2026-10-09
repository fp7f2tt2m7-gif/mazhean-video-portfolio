(() => {
  const form = document.querySelector('#source-form');
  const input = document.querySelector('#source-code');
  const output = document.querySelector('#share-url');
  const status = document.querySelector('#share-status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const code = input.value.trim();
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(code)) {input.reportValidity(); return;}
    output.value = `https://fp7f2tt2m7-gif.github.io/mazhean-video-portfolio/?hr=${encodeURIComponent(code)}`;
    status.textContent = '链接已生成，可复制后用于对应来源。';
  });
  document.querySelector('#copy-share-url').addEventListener('click', async () => {
    try {await navigator.clipboard.writeText(output.value); status.textContent = '分享链接已复制。';}
    catch {output.focus(); output.select(); status.textContent = '请复制已选中的分享地址。';}
  });
})();
