const snapshot = window.PORTFOLIO_STATS || {};
function valueOrDash(value) { return value === null || value === undefined || value === "" ? "—" : value; }
function renderPeriod(periodKey) {
  const period = snapshot.periods?.[periodKey] || {};
  document.querySelector("#metric-uv").textContent = valueOrDash(period.uv);
  document.querySelector("#metric-pv").textContent = valueOrDash(period.pv);
  document.querySelector("#metric-boss").textContent = valueOrDash(period.bossVisits);
  document.querySelector("#metric-duration").textContent = valueOrDash(period.avgDuration);
  document.querySelectorAll("[data-period]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.period === periodKey)));
}
function renderTrend() {
  const container = document.querySelector("#trend-content");
  const rows = snapshot.trend || [];
  if (!rows.length) { container.innerHTML = '<div class="empty"><div><strong>暂无访问数据</strong>百度统计产生首批记录后，这里会显示每日趋势。</div></div>'; return; }
  const maxValue = Math.max(...rows.map((row) => Number(row.uv) || 0), 1);
  container.innerHTML = `<div class="bars">${rows.map((row) => `<div class="bar-item" title="${row.date}：${row.uv} 人"><div class="bar" style="height:${Math.max(3, (Number(row.uv) || 0) / maxValue * 170)}px"></div><span class="bar-label">${row.label}</span></div>`).join("")}</div>`;
}
function renderRecent() {
  const container = document.querySelector("#recent-content");
  const rows = (snapshot.recent || []).slice(0, 5);
  if (!rows.length) { container.innerHTML = '<div class="empty"><div><strong>暂无访问记录</strong>后续仅展示时间、来源和匿名设备类型。</div></div>'; return; }
  container.innerHTML = `<div class="recent-list">${rows.map((row) => `<div class="recent-item"><strong>${row.source || "直接访问"}</strong><span>${row.time} · ${row.device || "未知设备"}${row.duration ? ` · ${row.duration}` : ""}</span></div>`).join("")}</div>`;
}
document.querySelectorAll("[data-period]").forEach((button) => button.addEventListener("click", () => renderPeriod(button.dataset.period)));
document.querySelector("#updated-at").textContent = snapshot.updatedAt ? `更新于 ${snapshot.updatedAt}` : "尚未更新";
renderPeriod("today"); renderTrend(); renderRecent();
