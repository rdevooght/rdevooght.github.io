function moveSlide(carouselId, direction) {
  console.log(carouselId);
  const carousel = document.getElementById(carouselId);
  const radios = carousel.querySelectorAll('input[type="radio"]');
  let currentIndex = Array.from(radios).findIndex((radio) => radio.checked);

  radios[currentIndex].checked = false;

  currentIndex += direction;
  if (currentIndex >= radios.length) currentIndex = 0;
  if (currentIndex < 0) currentIndex = radios.length - 1;

  radios[currentIndex].checked = true;
}
