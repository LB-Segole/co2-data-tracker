// listings, either from supabase if config.js is filled in, or this seed set
// company names here are placeholders, swap for real ones once real listings come in

var SEED_LISTINGS = [
  {id:"s1", company:"Highveld Brewing Co.", industry:"Brewery", country:"South Africa", region:"Gauteng", postal:"1930", volume:3200, purity:"Food-grade", notes:"Fermentation CO2, currently vented, available immediately.", email:"ops@example-brewery.co.za", status:"verified"},
  {id:"s2", company:"Vaal Cement Works", industry:"Cement", country:"South Africa", region:"Gauteng", postal:"1911", volume:48000, purity:"Industrial", notes:"Flue gas stream, capture-ready site, looking for long-term offtake.", email:"sustainability@example-cement.co.za", status:"verified"},
  {id:"s3", company:"Sedibeng Chemical Supply", industry:"Chemical", country:"South Africa", region:"Gauteng", postal:"1900", volume:12500, purity:"Industrial", notes:"Byproduct CO2 from ammonia process.", email:"info@example-chem.co.za", status:"verified"},
  {id:"s4", company:"Karoo Power Station", industry:"Power", country:"South Africa", region:"Northern Cape", postal:"8801", volume:210000, purity:"Industrial", notes:"Large-scale flue gas, exploring pilot capture partnerships.", email:"partnerships@example-power.co.za", status:"verified"},
  {id:"s5", company:"Durban Gas Distributors", industry:"Gas supplier", country:"South Africa", region:"KwaZulu-Natal", postal:"4001", volume:5400, purity:"Food-grade", notes:"Surplus food-grade CO2, flexible contract terms.", email:"sales@example-gas.co.za", status:"verified"},
  {id:"s6", company:"Nairobi Craft Brewers", industry:"Brewery", country:"Kenya", region:"Nairobi", postal:"00100", volume:1800, purity:"Food-grade", notes:"Small volume, ideal for pilot-scale buyers.", email:"hello@example-nairobi.co.ke", status:"verified"}
];

var sessionAdded = JSON.parse(localStorage.getItem("offtake_local_listings") || "[]");

function configured(){
  var c = window.OFFTAKE_CONFIG || {};
  return !!(c.SUPABASE_URL && c.SUPABASE_ANON_KEY);
}

function fetchListings(){
  if (!configured()){
    return Promise.resolve(SEED_LISTINGS.concat(sessionAdded));
  }
  var c = window.OFFTAKE_CONFIG;
  var url = c.SUPABASE_URL + "/rest/v1/" + c.TABLE_NAME + "?select=*&status=eq.verified";
  return fetch(url, {
    headers: { "apikey": c.SUPABASE_ANON_KEY, "Authorization": "Bearer " + c.SUPABASE_ANON_KEY }
  }).then(function(r){ return r.json(); })
    .then(function(rows){
      return rows.map(function(r){
        return { id:r.id, company:r.company_name, industry:r.industry, country:r.country, region:r.region, postal:r.postal_code, volume:r.co2_volume_tpy, purity:r.co2_purity, notes:r.notes, email:r.contact_email, status:r.status };
      }).concat(sessionAdded);
    })
    .catch(function(){ return SEED_LISTINGS.concat(sessionAdded); });
}

function matchesFilters(l, loc, industry, minvol, purity){
  if (loc){
    var hay = (l.country+" "+l.region+" "+l.postal).toLowerCase();
    if (hay.indexOf(loc.toLowerCase()) === -1) return false;
  }
  if (industry && l.industry !== industry) return false;
  if (minvol && Number(l.volume) < Number(minvol)) return false;
  if (purity && l.purity !== purity) return false;
  return true;
}

function renderStats(list){
  var elListings = document.getElementById("stat-listings");
  if (!elListings) return;
  elListings.textContent = list.length;
  var vol = list.reduce(function(s,l){ return s + (Number(l.volume)||0); },0);
  document.getElementById("stat-volume").textContent = vol >= 1000 ? Math.round(vol/1000)+"k" : vol;
  document.getElementById("stat-regions").textContent = new Set(list.map(function(l){return l.region;})).size;
  document.getElementById("stat-industries").textContent = new Set(list.map(function(l){return l.industry;})).size;
}

function renderListings(list){
  var grid = document.getElementById("listing-grid");
  if (!grid) return;
  var meta = document.getElementById("results-meta");
  grid.innerHTML = "";
  if (!list.length){
    grid.innerHTML = "<div class='empty-state'>No listings match those filters yet. Widen the search, or be the first to list in this region.</div>";
    if (meta) meta.textContent = "0 results";
    return;
  }
  if (meta) meta.textContent = list.length + " result" + (list.length===1?"":"s");
  list.forEach(function(l){
    var card = document.createElement("div");
    card.className = "listing-card";
    var subject = encodeURIComponent("OFFTAKE inquiry: "+l.company);
    var body = encodeURIComponent("Hi, I found your CO2 listing on OFFTAKE ("+l.company+", "+l.region+", "+l.country+") and would like to discuss an offtake arrangement.");
    var mailto = "mailto:"+l.email+"?subject="+subject+"&body="+body;
    card.innerHTML =
      "<div class='listing-top'><span class='listing-industry'>"+l.industry+"</span><span class='listing-status'>"+(l.status==="verified"?"Verified":"Pending review")+"</span></div>" +
      "<h3>"+l.company+"</h3>" +
      "<div class='listing-loc'>"+l.region+", "+l.country+(l.postal? " &middot; "+l.postal:"")+"</div>" +
      "<div class='listing-metrics'>" +
        "<div><div class='lm-val'>"+Number(l.volume).toLocaleString()+"</div><div class='lm-label'>t CO2 / yr</div></div>" +
        "<div><div class='lm-val'>"+(l.purity||"Unknown")+"</div><div class='lm-label'>Purity</div></div>" +
      "</div>" +
      "<div class='listing-notes'>"+(l.notes||"")+"</div>" +
      "<a class='listing-request' href='"+mailto+"'>Request introduction</a>";
    grid.appendChild(card);
  });
}

var ALL_LISTINGS = [];

function applyFilters(){
  var loc = document.getElementById("f-location").value.trim();
  var industry = document.getElementById("f-industry").value;
  var minvol = document.getElementById("f-minvol").value;
  var purity = document.getElementById("f-purity").value;
  var filtered = ALL_LISTINGS.filter(function(l){ return matchesFilters(l, loc, industry, minvol, purity); });
  renderListings(filtered);
}

function submitListing(e){
  e.preventDefault();
  var listing = {
    id: "local-"+Date.now(),
    company: document.getElementById("in-company").value,
    industry: document.getElementById("in-industry").value,
    country: document.getElementById("in-country").value,
    region: document.getElementById("in-region").value,
    postal: document.getElementById("in-postal").value,
    volume: document.getElementById("in-volume").value,
    purity: document.getElementById("in-purity").value,
    notes: document.getElementById("in-notes").value,
    email: document.getElementById("in-email").value,
    status: "pending"
  };

  if (configured()){
    var c = window.OFFTAKE_CONFIG;
    fetch(c.SUPABASE_URL + "/rest/v1/" + c.TABLE_NAME, {
      method: "POST",
      headers: {
        "apikey": c.SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + c.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        company_name: listing.company, industry: listing.industry, country: listing.country,
        region: listing.region, postal_code: listing.postal, co2_volume_tpy: listing.volume,
        co2_purity: listing.purity, notes: listing.notes, contact_email: listing.email
      })
    }).catch(function(){});
  }

  sessionAdded.push(listing);
  localStorage.setItem("offtake_local_listings", JSON.stringify(sessionAdded));

  document.getElementById("listing-form").style.display = "none";
  document.getElementById("form-success").style.display = "block";
}

// background dots + lines, random points connected if close enough
function drawNodes(){
  var svg = document.getElementById("node-field");
  if (!svg) return;
  var w = window.innerWidth, h = Math.max(window.innerHeight, 900);
  svg.setAttribute("viewBox","0 0 "+w+" "+h);
  var pts = [];
  var n = Math.min(22, Math.floor((w*h)/70000));
  for (var i=0;i<n;i++){ pts.push([Math.random()*w, Math.random()*h]); }
  var html = "";
  for (var a=0;a<pts.length;a++){
    for (var b=a+1;b<pts.length;b++){
      var dx=pts[a][0]-pts[b][0], dy=pts[a][1]-pts[b][1];
      var d=Math.sqrt(dx*dx+dy*dy);
      if (d < 220){
        html += "<line x1='"+pts[a][0]+"' y1='"+pts[a][1]+"' x2='"+pts[b][0]+"' y2='"+pts[b][1]+"' stroke='#3f5fa0' stroke-width='0.6' opacity='"+(0.12*(1-d/220))+"'/>";
      }
    }
  }
  pts.forEach(function(p){ html += "<circle cx='"+p[0]+"' cy='"+p[1]+"' r='2' fill='#5b7fc4' opacity='0.35'/>"; });
  svg.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", function(){
  drawNodes();

  if (document.getElementById("listing-grid")){
    fetchListings().then(function(list){
      ALL_LISTINGS = list;
      renderStats(ALL_LISTINGS);
      renderListings(ALL_LISTINGS);
    });
  } else if (document.getElementById("stat-listings")){
    fetchListings().then(function(list){ renderStats(list); });
  }
});