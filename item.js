(() => {
  const loadingEl = document.getElementById("item-loading");
  const detailEl = document.getElementById("item-detail");

  function showError(message, error) {
    console.error(message, error || "");
    loadingEl.hidden = false;
    loadingEl.innerHTML = `<b>Não foi possível carregar este item.</b><br><span class="muted">${esc(message)}</span>`;
    detailEl.hidden = true;
  }

  try {
    if (!window.ITEMS_DATA) {
      throw new Error("items-data.js não foi carregado.");
    }

    const query = new URLSearchParams(window.location.search).get("id") || "";
    const item = window.ITEMS_DATA[query] || Object.values(window.ITEMS_DATA).find(
      entry => entry.name.toLowerCase() === query.toLowerCase()
    );

    const quantityText = row => {
      const min = row.min ?? "—";
      return row.max != null && row.max !== row.min
        ? `x${min}–${row.max}`
        : `x${min}`;
    };

    function sourceRow(row, index) {
      const pal = window.PALS?.[row.palId];
      return `<article class="item-source-row${index === 0 ? " is-best" : ""}">
        <div class="item-source-rank">${index === 0 ? "★" : index + 1}</div>
        <a class="item-source-pal" href="pal.html?pal=${encodeURIComponent(row.palName)}">
          ${pal?.icon ? assetImg(ASSETS.palsDirectory, pal.icon, row.palName, "item-source-pal-image") : ""}
          <div>
            <strong>${esc(row.palName)}</strong>
            <span>#${row.palIndex ?? "—"}${row.palSuffix || ""}</span>
          </div>
        </a>
        <div class="item-source-value"><span>Quantidade</span><b>${quantityText(row)}</b></div>
        <div class="item-source-value"><span>Taxa</span><b>${row.rate != null ? `${row.rate}%` : "—"}</b></div>
      </article>`;
    }

    if (!item) {
      loadingEl.innerHTML = '<b>Item não encontrado.</b><br><a href="itens.html">Voltar para a Enciclopédia de Itens</a>';
      return;
    }

    document.title = `${item.name} | Itens`;
    const sources = item.droppedBy || [];
    const best = sources[0];

    detailEl.innerHTML = `
      <div class="item-breadcrumb"><a href="itens.html">Todos os itens</a><span>/</span><b>${esc(item.name)}</b></div>
      <section class="item-detail-hero panel">
        <div class="item-detail-icon">
          ${item.icon ? assetImg(ASSETS.itemsDirectory, item.icon, item.name, "item-detail-image", "eager") : "◆"}
        </div>
        <div>
          <span class="hero-kicker">ITEM DROPÁVEL</span>
          <h1>${esc(item.name)}</h1>
          <p class="muted">${sources.length} Pal${sources.length === 1 ? "" : "s"} dropam este item.</p>
          ${best ? `<div class="item-best-source">Melhor fonte: <a href="pal.html?pal=${encodeURIComponent(best.palName)}">${esc(best.palName)}</a> — ${quantityText(best)} · ${best.rate ?? "—"}%</div>` : ""}
        </div>
      </section>
      <section class="item-detail-section">
        <div class="section-heading">
          <div><span class="hero-kicker">FONTES</span><h2>Pals que dropam este item</h2></div>
          <p>Ordenado por taxa e quantidade máxima.</p>
        </div>
        <div class="item-source-list">${sources.map(sourceRow).join("")}</div>
      </section>`;

    loadingEl.hidden = true;
    detailEl.hidden = false;
    activateAssetFallbacks(detailEl);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Erro desconhecido.", error);
  }
})();
