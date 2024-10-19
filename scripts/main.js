import { personIcon } from "./constants.js";
import getIcon, { getStatus } from "./helpers.js";
import ui from "./ui.js";

//*Global değişkenler

//!Haritada tıklanan son konum

let map;
let clickedCoords;
let layer;
let notes = JSON.parse(localStorage.getItem("notes")) || [];

window.navigator.geolocation.getCurrentPosition(
  (e) => {
    loadMap([e.coords.latitude, e.coords.longitude], "Mevcut Konum");
  },
  () => {
    loadMap([39.925696, 32.855806], "Varsayılan Konum");
  }
);

//! Haritayı yükler
function loadMap(currentPosition, msg) {
  //*console.log("konum", currentPosition);
  //!Harita kurulumu için bu kod yapısı izlenir.
  map = L.map("map", { zoomControl: false }).setView(currentPosition, 8);

  //*Sağ aşağıya zoom butonunu ekle
  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);

  //*Haritanın render etmesi için yazılan kod yapısı
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  //*Haritanın üzerine imleçlerin ekleneceği katman oluşturma

  layer = L.layerGroup().addTo(map);

  //*Haritada yer belirtecek imleci çağırmak için kullanılan kod
  L.marker(currentPosition, { icon: personIcon }).addTo(map).bindPopup(msg);

  //*Haritada ki tıklanma olaylarını izleme

  map.on("click", onMapClick);

  //*Notları ekrana bas
  renderNotes();
  renderMakers();
}

//*!Tıklanma olayında çalışacak fonksiyon
function onMapClick(e) {
  //*Tıklanan konumun koordinatlarını global değişkene aktarma
  clickedCoords = [e.latlng.lat, e.latlng.lng];

  //*Aside elementine add classını ekleme
  ui.aside.className = "add";
}

//*!İptal butonuna tıklanınca
ui.cancelBtn.addEventListener("click", () => {
  //*menüyü kapatma 'Add classın kaldır'
  ui.aside.className = "";
});

//*Form gönderilince
ui.form.addEventListener("submit", (e) => {
  e.preventDefault();

  //*İnputtaki verilere ulaşma
  const title = e.target[0].value;
  const date = e.target[1].value;
  const status = e.target[2].value;

  //*Yeni bir nesne oluştur
  const newNote = {
    id: new Date().getTime(),
    title,
    date,
    status,
    coords: clickedCoords,
  };

  //*Nesneyi global değişkene kaydet
  notes.unshift(newNote);
  //*Nesneyi LocalStorage kaydet
  localStorage.setItem("notes", JSON.stringify(notes));

  //*Aside alanından add classını kaldır
  ui.aside.className = "";

  //*Kayıt yapıldıktan sonra form alanını temizle
  e.target.reset();

  //*Yeni notun ekrana gelmesi için notları tekrardan renderla

  renderNotes();
  renderMakers();
});

//! Ekrana imleç renderlelama

function renderMakers() {
  //*Eski imleçleri kaldırma
  layer.clearLayers();
  notes.forEach((item) => {
    const icon = getIcon(item.status);
    L.marker(item.coords, { icon }) //*imleci oluştur
      .addTo(layer) //* imleçler katmanına ekle
      .bindPopup(item.title); //*İmlece popup ekle
  });
}

//*Ekrana notları renderla

function renderNotes() {
  const noteCards = notes
    .map((item) => {
      //*Tarih kısmını daha okunabilir yaptık
      const date = new Date(item.date).toLocaleString("tr", {
        day: "2-digit",
        month: "long",
        year: "2-digit",
      });

      //*Status değerini çevir
      const status = getStatus(item.status);

      //*Oluşturulacak notun HTML içeriğini belirle
      return `
          <li data-id="${item.id}">
          <div>
            <p>${item.title}</p>
            <p>${date} </p>
            <p>${status}</p>
          </div>
 
          <div class="icons">
            <i data-id="${item.id}" class="bi bi-airplane-fill" id="fly"></i>
            <i data-id="${item.id}" class="bi bi-trash3-fill" id="delete"></i>
          </div>
        </li>
        
        `;
    })
    .join("");

  //*Notları liste alanında renderla
  ui.list.innerHTML = noteCards;

  //*Ekranda ki delete iconlarını al ve tıklanınca silme fonksiyonunu çağır
  document.querySelectorAll("li #delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteNote(btn.dataset.id));
  });

  //*Fly iconlarını al ve tıklanınca uçuş fonksiyonunu çağır
  document.querySelectorAll("li #fly").forEach((btn) => {
    btn.addEventListener("click", () => flyToLocation(btn.dataset.id));
  });
}

//*Silme butonuna tıklanınca

function deleteNote(id) {
  const res = confirm("Notu silmeyi onaylıyor musunuz?");
  //*Onaylarsa sil
  if (res) {
    //*İD'si bilinen elemanı diziden kaldır.
    notes = notes.filter((note) => note.id !== +id);

    //*Güncel notları ekrana renderla
    renderNotes();

    //*LocalStorage'ı da güncelle
    localStorage.setItem("notes", JSON.stringify(notes));

    //*Güncel imleçleri renderla

    renderMakers();
  }
}

//*Uçuş butonuna tıklanınca

function flyToLocation(id) {
  //*İD'si bilinen elemanı dizide bul
  const note = notes.find((note) => note.id === +id);

  //*Note'un koordinatlarına ulaş

  map.flyTo(note.coords, 12);
}

//*Tıklanma olayında ;

//*Aside alanındaki form ve liste içeriğini gizlemek için hide class'ı ekle
ui.arrow.addEventListener("click", () => {
  ui.aside.classList.toggle("hide");
});
