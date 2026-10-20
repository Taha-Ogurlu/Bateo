/**
 * Günün sözü — 60 alıntı (filozof, yazar, bilim insanı, psikolog).
 * Her gün bir söz gösterilir; 60 gün sonra başa döner (~2 ay).
 *
 * GÜNCELLEME: Aşağıdaki QUOTES dizisine satır ekleyip/çıkarabilirsin.
 * Biçim:  { text: "söz", by: "kimin söylediği" }
 * Sıralamayı değiştirmen yeterli; gün hesabı otomatik uyum sağlar.
 */

export interface Quote {
  text: string;
  by: string;
}

export const QUOTES: Quote[] = [
  { text: "Sorgulanmamış bir hayat, yaşanmaya değmez.", by: "Sokrates" },
  { text: "Tek bildiğim, hiçbir şey bilmediğimdir.", by: "Sokrates" },
  { text: "Biz sürekli yaptığımız şeyleriz; mükemmellik bir eylem değil, bir alışkanlıktır.", by: "Aristoteles" },
  { text: "Öğrenmenin kökleri acı, meyvesi tatlıdır.", by: "Aristoteles" },
  { text: "Düşünmek, ruhun kendi kendisiyle konuşmasıdır.", by: "Platon" },
  { text: "Dış olaylar seni etkilemez; onlara verdiğin tepki etkiler.", by: "Marcus Aurelius" },
  { text: "Önündeki engel, yolun ta kendisidir.", by: "Marcus Aurelius" },
  { text: "Şans, hazırlıklı olanın yanındadır.", by: "Seneca" },
  { text: "Mesele ne kadar yaşadığın değil; o hayatı ne kadar yaşadığındır.", by: "Seneca" },
  { text: "İnsanları rahatsız eden olaylar değil, olaylar hakkındaki düşünceleridir.", by: "Epiktetos" },
  { text: "Kontrol edebildiklerine odaklan; gerisini olduğu gibi kabul et.", by: "Epiktetos" },
  { text: "Duyduğumu unuturum, gördüğümü hatırlarım, yaptığımı öğrenirim.", by: "Konfüçyüs" },
  { text: "Ne kadar yavaş gittiğin önemli değil; durmadığın sürece.", by: "Konfüçyüs" },
  { text: "Bin millik yolculuk, tek bir adımla başlar.", by: "Lao Tzu" },
  { text: "Başkalarını bilmek bilgi, kendini bilmek bilgeliktir.", by: "Lao Tzu" },
  { text: "Beni öldürmeyen şey, beni güçlendirir.", by: "Friedrich Nietzsche" },
  { text: "Kaosun içinden bir yıldız doğurmak gerekir.", by: "Friedrich Nietzsche" },
  { text: "Bilmeye cesaret et!", by: "Immanuel Kant" },
  { text: "Düşünüyorum, öyleyse varım.", by: "René Descartes" },
  { text: "Özgür insan ölümü değil, yaşamı düşünür.", by: "Baruch Spinoza" },
  { text: "Hayat ileri doğru yaşanır, geriye doğru anlaşılır.", by: "Søren Kierkegaard" },
  { text: "Zorlukların ortasında fırsatlar yatar.", by: "Albert Einstein" },
  { text: "Hayal gücü, bilgiden daha önemlidir.", by: "Albert Einstein" },
  { text: "Önemli olan sorgulamayı bırakmamaktır.", by: "Albert Einstein" },
  { text: "Hayatta korkulacak bir şey yok; yalnızca anlaşılması gereken şeyler var.", by: "Marie Curie" },
  { text: "Daha ileriyi görebildiysem, devlerin omuzlarında durduğum içindir.", by: "Isaac Newton" },
  { text: "Anlatamıyorsan, tam anlamamışsın demektir.", by: "Richard Feynman" },
  { text: "Öğrenmenin ilk kuralı: kendini kandırmamak. En kolay kandırdığımız kişi ise kendimiziz.", by: "Richard Feynman" },
  { text: "Hayatta kalan, en güçlü ya da en zeki değil; değişime en iyi uyum sağlayandır.", by: "Charles Darwin" },
  { text: "Kitap, insanın büyü yapabildiğinin kanıtıdır.", by: "Carl Sagan" },
  { text: "Bilginin en büyük düşmanı cehalet değil, bilgi yanılsamasıdır.", by: "Stephen Hawking" },
  { text: "Şans, hazırlıklı zihinden yanadır.", by: "Louis Pasteur" },
  { text: "Deha, yüzde bir ilham, yüzde doksan dokuz terdir.", by: "Thomas Edison" },
  { text: "Dışa bakan hayal kurar, içe bakan uyanır.", by: "Carl Jung" },
  { text: "Başıma gelenler beni tanımlamaz; olmayı seçtiğim kişi tanımlar.", by: "Carl Jung" },
  { text: "Yaşamak için bir nedeni olan insan, hemen her nasıla dayanabilir.", by: "Viktor Frankl" },
  { text: "Her şey ellerinden alınabilir; tek bir şey hariç: tutumunu seçme özgürlüğün.", by: "Viktor Frankl" },
  { text: "Elinde sadece çekiç olan, her şeyi çivi olarak görür.", by: "Abraham Maslow" },
  { text: "Hayatını değiştirmenin en hızlı yolu, tutumunu değiştirmektir.", by: "William James" },
  { text: "Önemli olan başına ne geldiği değil, onunla ne yaptığındır.", by: "Alfred Adler" },
  { text: "Güzellik dünyayı kurtaracak.", by: "Dostoyevski" },
  { text: "Yaşamayı çok sevdim; yalnızca yaşamak bile yeter.", by: "Dostoyevski" },
  { text: "Herkes dünyayı değiştirmeyi düşünür; kimse kendini değiştirmeyi düşünmez.", by: "Lev Tolstoy" },
  { text: "Kitap, içimizdeki donmuş denizi kırmak için bir baltadır.", by: "Franz Kafka" },
  { text: "Soruların cevaplarını şimdi yaşayamazsın; o hâlde soruları yaşa.", by: "Rainer Maria Rilke" },
  { text: "Bilmek yetmez, uygulamak gerekir; istemek yetmez, yapmak gerekir.", by: "Goethe" },
  { text: "İyi ya da kötü diye bir şey yoktur; düşünce onu öyle yapar.", by: "William Shakespeare" },
  { text: "Zamanı gelmiş bir fikirden daha güçlü hiçbir şey yoktur.", by: "Victor Hugo" },
  { text: "Kışın ortasında, içimde yenilmez bir yaz olduğunu keşfettim.", by: "Albert Camus" },
  { text: "İnsan, yaptığı seçimlerin toplamıdır.", by: "Jean-Paul Sartre" },
  { text: "Başkasının özgürlüğü, benim özgürlüğümün koşuludur.", by: "Simone de Beauvoir" },
  { text: "Cennet, bir kütüphane gibi olmalı.", by: "Jorge Luis Borges" },
  { text: "Düşünmek, kendinle yaptığın sessiz bir konuşmadır.", by: "Hannah Arendt" },
  { text: "Dün dünde kaldı; bugün yeni şeyler söylemek gerek.", by: "Mevlana" },
  { text: "Ne kadar bilirsen bil, anlatabildiğin karşındakinin anladığı kadardır.", by: "Mevlana" },
  { text: "İlim ilim bilmektir; ilim kendini bilmektir.", by: "Yunus Emre" },
  { text: "Hayatta en hakiki mürşit ilimdir.", by: "Mustafa Kemal Atatürk" },
  { text: "Bir şeye ihtiyacımız var: çalışkan olmak.", by: "Mustafa Kemal Atatürk" },
  { text: "Yaşamak; bir ağaç gibi tek ve hür, bir orman gibi kardeşçe.", by: "Nâzım Hikmet" },
  { text: "Söyle bana, unuturum; öğret bana, hatırlarım; dahil et beni, öğrenirim.", by: "Benjamin Franklin" },
];

/** Günün sözü — güne göre sabit, 60 günde bir başa döner */
export function quoteOfDay(date = new Date()): Quote {
  const dayIndex = Math.floor(date.getTime() / 86400000);
  return QUOTES[((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length];
}

export function greeting(hour = new Date().getHours()): string {
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}
