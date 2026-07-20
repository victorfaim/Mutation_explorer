
const featuredNames=["Aegidron","Amione","Anubis","Astegon","Bellanoir","Bellanoir Libero","Blazamut","Bastigor"];
const featured=featuredNames.map(findPal).filter(Boolean);

document.getElementById("hero-pals").innerHTML=featured.map((p,index)=>`
  <div class="hero-pal hero-pal-${index+1}" title="${esc(p.name)}">
    <div class="hero-pal-ring">
      <img src="${palIconUrl(p)}" alt="${esc(p.name)}" loading="${index<4?"eager":"lazy"}"
           decoding="async" onerror="this.style.display='none'">
    </div>
    <span>${esc(p.name)}</span>
  </div>
`).join("");
